package com.farmverse.backend.service;

import com.farmverse.backend.dto.AgronomistPrescriptionRequest;
import com.farmverse.backend.dto.DiseaseScanRequest;
import com.farmverse.backend.dto.DiseaseStatusUpdateRequest;
import com.farmverse.backend.entity.*;
import com.farmverse.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DiseaseService {

    private final DiseaseDetectionRepository diseaseRepo;
    private final FarmRepository farmRepo;
    private final CropRepository cropRepo;
    private final FarmerRepository farmerRepo;
    private final UserRepository userRepo;
    private final GeminiVisionService geminiVisionService;

    public DiseaseService(DiseaseDetectionRepository diseaseRepo,
                          FarmRepository farmRepo,
                          CropRepository cropRepo,
                          FarmerRepository farmerRepo,
                          UserRepository userRepo,
                          GeminiVisionService geminiVisionService) {
        this.diseaseRepo = diseaseRepo;
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
}
