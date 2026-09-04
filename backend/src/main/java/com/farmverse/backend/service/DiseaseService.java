package com.farmverse.backend.service;

import com.farmverse.backend.dto.AgronomistPrescriptionRequest;
import com.farmverse.backend.dto.DiseaseScanRequest;
import com.farmverse.backend.dto.DiseaseStatusUpdateRequest;
import com.farmverse.backend.dto.DiseaseTrackingDTO;
import com.farmverse.backend.entity.*;
import com.farmverse.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DiseaseService {

    private final DiseaseDetectionRepository diseaseRepo;
    private final DiseaseTreatmentLogRepository treatmentLogRepo;
    private final FarmRepository farmRepo;
    private final CropRepository cropRepo;
    private final FarmerRepository farmerRepo;
    private final UserRepository userRepo;
    private final GeminiVisionService geminiVisionService;

    public DiseaseService(DiseaseDetectionRepository diseaseRepo,
                          DiseaseTreatmentLogRepository treatmentLogRepo,
                          FarmRepository farmRepo,
                          CropRepository cropRepo,
                          FarmerRepository farmerRepo,
                          UserRepository userRepo,
                          GeminiVisionService geminiVisionService) {
        this.diseaseRepo = diseaseRepo;
        this.treatmentLogRepo = treatmentLogRepo;
        this.farmRepo = farmRepo;
        this.cropRepo = cropRepo;
        this.farmerRepo = farmerRepo;
        this.userRepo = userRepo;
        this.geminiVisionService = geminiVisionService;
    }

    public List<DiseaseDetection> getDetections(String userEmail) {
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        String role = user.getRole();
        // Agronomists, Admins, and Consumers see the platform-wide surveillance list
        if ("ROLE_ADMIN".equals(role) || "ROLE_AGRONOMIST".equals(role) || "ROLE_NORMAL_USER".equals(role)) {
            return diseaseRepo.findAllByOrderByDetectedAtDesc();
        }

        // Farmers only see their own registered disease cases
        Farmer farmer = farmerRepo.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found"));
        return diseaseRepo.findByFarmerOrderByDetectedAtDesc(farmer);
    }

    public DiseaseDetection getDetectionById(Long id, String userEmail) {
        DiseaseDetection detection = diseaseRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection record not found with ID: " + id));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        // If Farmer, verify plot ownership
        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !detection.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only view disease cases from your own farm.");
            }
        }
        return detection;
    }

    public DiseaseDetection scanAndDiagnose(String userEmail, DiseaseScanRequest request) {
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        Farmer farmer = farmerRepo.findByUser(user).orElse(null);
        Farm farm = farmRepo.findById(request.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with ID: " + request.getFarmId()));

        // Security check: Farmers can only scan their own farms
        if ("ROLE_FARMER".equals(user.getRole())) {
            if (farmer == null || !farm.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only diagnose crops on your own registered farms.");
            }
        } else if (farmer == null) {
            // For admin/demo, link to farm's owner
            farmer = farm.getFarmer();
        }

        Crop crop = null;
        String resolvedCropName = request.getCropName();
        if (request.getCropId() != null) {
            crop = cropRepo.findById(request.getCropId()).orElse(null);
            if (crop != null && (resolvedCropName == null || resolvedCropName.isBlank())) {
                resolvedCropName = crop.getCropName();
            }
        }
        if (resolvedCropName == null || resolvedCropName.isBlank()) {
            resolvedCropName = "General Crop";
        }

        // Call AI Pathology Engine
        GeminiVisionService.DiagnosisResult aiResult = geminiVisionService.diagnoseCropDisease(
                resolvedCropName, request.getNotes(), request.getImageUrl()
        );

        // If AI Vision visually recognized the actual crop from the specimen photo, prioritize it!
        if (aiResult.cropIdentified != null && !aiResult.cropIdentified.isBlank() 
                && !aiResult.cropIdentified.equalsIgnoreCase("General") 
                && !aiResult.cropIdentified.equalsIgnoreCase("General Crop")) {
            resolvedCropName = aiResult.cropIdentified;
        }

        DiseaseDetection detection = new DiseaseDetection();
        detection.setFarm(farm);
        detection.setCrop(crop);
        detection.setFarmer(farmer);
        detection.setCropName(resolvedCropName);
        detection.setDiseaseName(aiResult.diseaseName);
        detection.setPathogenType(aiResult.pathogenType);
        detection.setConfidence(aiResult.confidence);
        detection.setSeverity(aiResult.severity);
        detection.setAffectedArea(aiResult.affectedArea);
        detection.setTreatment(aiResult.treatment);
        detection.setImageUrl(request.getImageUrl());
        detection.setStatus("Detected");
        detection.setAgronomistVerified(false);
        detection.setDetectedAt(LocalDateTime.now());
        detection.setUpdatedAt(LocalDateTime.now());

        return diseaseRepo.save(detection);
    }

    public DiseaseDetection updateStatus(Long id, String userEmail, DiseaseStatusUpdateRequest request) {
        DiseaseDetection detection = diseaseRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection not found"));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !detection.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only update disease cases on your own farm.");
            }
        }

        detection.setStatus(request.getStatus().trim());
        detection.setUpdatedAt(LocalDateTime.now());
        return diseaseRepo.save(detection);
    }

    public DiseaseDetection submitPrescription(Long id, String userEmail, AgronomistPrescriptionRequest request) {
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if (!"ROLE_AGRONOMIST".equals(user.getRole()) && !"ROLE_ADMIN".equals(user.getRole())) {
            throw new SecurityException("Access denied: Only certified Agronomists and Administrators can issue official crop prescriptions.");
        }

        DiseaseDetection detection = diseaseRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection not found"));

        if (request.getConfirmedDisease() != null && !request.getConfirmedDisease().isBlank()) {
            detection.setDiseaseName(request.getConfirmedDisease().trim());
        }
        if (request.getSeverity() != null && !request.getSeverity().isBlank()) {
            detection.setSeverity(request.getSeverity().trim());
        }
        detection.setAgronomistPrescription(request.getPrescription().trim());
        detection.setAgronomistNotes(request.getClinicalNotes());
        detection.setAgronomistVerified(true);
        detection.setVerifiedByAgronomistName(user.getFullName() != null ? user.getFullName() : "Certified Agronomist");
        detection.setUpdatedAt(LocalDateTime.now());

        return diseaseRepo.save(detection);
    }

    public void deleteDetection(Long id, String userEmail) {
        DiseaseDetection detection = diseaseRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection not found"));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !detection.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You cannot delete another farmer's disease case.");
            }
        }
        diseaseRepo.delete(detection);
    }

    public Map<String, Object> getSurveillanceStats(String userEmail) {
        List<DiseaseDetection> list = getDetections(userEmail);
        Map<String, Object> stats = new HashMap<>();
        long total = list.size();
        long active = list.stream().filter(d -> !"Resolved".equalsIgnoreCase(d.getStatus())).count();
        long resolved = list.stream().filter(d -> "Resolved".equalsIgnoreCase(d.getStatus())).count();
        double avgConfidence = list.isEmpty() ? 0.0 : list.stream().mapToDouble(DiseaseDetection::getConfidence).average().orElse(0.0);

        stats.put("totalDetections", total);
        stats.put("activeCases", active);
        stats.put("resolvedCases", resolved);
        stats.put("avgConfidence", Math.round(avgConfidence));
        return stats;
    }

    @Transactional
    public DiseaseTreatmentLog addTreatmentLog(Long detectionId, String userEmail, DiseaseTrackingDTO.AddTreatmentLogRequest req) {
        DiseaseDetection detection = diseaseRepo.findById(detectionId)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection not found with ID: " + detectionId));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !detection.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only log treatments for your own crops.");
            }
        }

        DiseaseTreatmentLog log = new DiseaseTreatmentLog();
        log.setDiseaseDetection(detection);
        log.setTreatmentName(req.getTreatmentName().trim());
        log.setTreatmentType(req.getTreatmentType() != null && !req.getTreatmentType().isBlank() ? req.getTreatmentType() : "CHEMICAL_FUNGICIDE");
        log.setTreatmentDate(req.getTreatmentDate() != null ? req.getTreatmentDate() : LocalDateTime.now());
        log.setDosage(req.getDosage() != null ? req.getDosage().trim() : "Standard label dose");
        log.setCostInr(req.getCostInr() != null ? Math.max(0.0, req.getCostInr()) : 0.0);

        int recoveryPct = req.getRecoveryPercentage() != null ? Math.min(100, Math.max(0, req.getRecoveryPercentage())) : 30;
        log.setRecoveryPercentage(recoveryPct);
        log.setFollowUpImageUrl(req.getFollowUpImageUrl());
        log.setNotes(req.getNotes());
        log.setAppliedBy(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail());
        log.setCreatedAt(LocalDateTime.now());

        DiseaseTreatmentLog savedLog = treatmentLogRepo.save(log);

        // Update overall DiseaseDetection recovery progress & cost
        detection.setCurrentRecoveryPercentage(recoveryPct);
        double previousTotalCost = detection.getTotalTreatmentCostInr() != null ? detection.getTotalTreatmentCostInr() : 0.0;
        detection.setTotalTreatmentCostInr(previousTotalCost + log.getCostInr());

        if (req.getFollowUpImageUrl() != null && !req.getFollowUpImageUrl().isBlank()) {
            detection.setLatestFollowUpImageUrl(req.getFollowUpImageUrl());
        }

        // Auto-advance lifecycle stage based on recovery %
        if (recoveryPct >= 100) {
            detection.setRecoveryStage("RESOLVED_HEALTHY");
            detection.setStatus("Resolved");
            detection.setContainmentStatus("ERADICATED");
        } else if (recoveryPct >= 60) {
            detection.setRecoveryStage("SIGNIFICANT_RECOVERY");
            detection.setStatus("Treating");
        } else {
            detection.setRecoveryStage("UNDER_TREATMENT");
            detection.setStatus("Treating");
        }

        detection.setUpdatedAt(LocalDateTime.now());
        diseaseRepo.save(detection);

        return savedLog;
    }

    public List<DiseaseTreatmentLog> getTreatmentLogs(Long detectionId, String userEmail) {
        diseaseRepo.findById(detectionId)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection not found"));

        return treatmentLogRepo.findByDiseaseDetectionIdOrderByTreatmentDateAsc(detectionId);
    }

    @Transactional
    public void deleteTreatmentLog(Long logId, String userEmail) {
        DiseaseTreatmentLog log = treatmentLogRepo.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Treatment log not found with ID: " + logId));

        treatmentLogRepo.delete(log);
    }

    @Transactional
    public DiseaseDetection updateContainment(Long detectionId, String userEmail, DiseaseTrackingDTO.UpdateContainmentRequest req) {
        DiseaseDetection detection = diseaseRepo.findById(detectionId)
                .orElseThrow(() -> new IllegalArgumentException("Disease detection not found"));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !detection.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only update containment for your own farm.");
            }
        }

        String status = req.getContainmentStatus().toUpperCase();
        detection.setContainmentStatus(status);
        if ("ERADICATED".equals(status)) {
            detection.setRecoveryStage("RESOLVED_HEALTHY");
            detection.setStatus("Resolved");
            detection.setCurrentRecoveryPercentage(100);
        }

        detection.setUpdatedAt(LocalDateTime.now());
        return diseaseRepo.save(detection);
    }

    public DiseaseTrackingDTO.TrackingSummaryResponse getTrackingSummary(String userEmail) {
        List<DiseaseDetection> list = getDetections(userEmail);

        long total = list.size();
        long active = list.stream().filter(d -> "ACTIVE_INFECTION".equalsIgnoreCase(d.getRecoveryStage()) || "Detected".equalsIgnoreCase(d.getStatus())).count();
        long treating = list.stream().filter(d -> "UNDER_TREATMENT".equalsIgnoreCase(d.getRecoveryStage()) || "SIGNIFICANT_RECOVERY".equalsIgnoreCase(d.getRecoveryStage())).count();
        long resolved = list.stream().filter(d -> "Resolved".equalsIgnoreCase(d.getStatus()) || "RESOLVED_HEALTHY".equalsIgnoreCase(d.getRecoveryStage())).count();
        long quarantined = list.stream().filter(d -> "QUARANTINED".equalsIgnoreCase(d.getContainmentStatus()) || "SPREADING".equalsIgnoreCase(d.getContainmentStatus())).count();

        double totalSpending = list.stream()
                .mapToDouble(d -> d.getTotalTreatmentCostInr() != null ? d.getTotalTreatmentCostInr() : 0.0)
                .sum();

        double containmentSuccess = total > 0
                ? Math.round(((double)(total - quarantined) / total) * 1000.0) / 10.0
                : 100.0;

        double avgDays = 12.5;

        return new DiseaseTrackingDTO.TrackingSummaryResponse(
                total,
                active,
                treating,
                resolved,
                quarantined,
                avgDays,
                totalSpending,
                containmentSuccess
        );
    }
}
