package com.farmverse.backend.service;

import com.farmverse.backend.dto.ReportDTO;
import com.farmverse.backend.entity.*;
import com.farmverse.backend.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final FarmRepository farmRepository;
    private final CropRepository cropRepository;
    private final SoilDataRepository soilDataRepository;
    private final DiseaseDetectionRepository diseaseDetectionRepository;
    private final IrrigationScheduleRepository irrigationScheduleRepository;
    private final PdfGeneratorService pdfGeneratorService;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            FarmerRepository farmerRepository,
            FarmRepository farmRepository,
            CropRepository cropRepository,
            SoilDataRepository soilDataRepository,
            DiseaseDetectionRepository diseaseDetectionRepository,
            IrrigationScheduleRepository irrigationScheduleRepository,
            PdfGeneratorService pdfGeneratorService
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.farmRepository = farmRepository;
        this.cropRepository = cropRepository;
        this.soilDataRepository = soilDataRepository;
        this.diseaseDetectionRepository = diseaseDetectionRepository;
        this.irrigationScheduleRepository = irrigationScheduleRepository;
        this.pdfGeneratorService = pdfGeneratorService;
    }

    @Transactional
    public ReportDTO.ReportResponse generateReport(String userEmail, ReportDTO.GenerateReportRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isStaff = role.contains("ADMIN") || role.contains("AGRONOMIST");

        // 1. Resolve Target Farms
        List<Farm> targetFarms = new ArrayList<>();
        Farm specificFarm = null;

        if (request.getFarmId() != null) {
            specificFarm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + request.getFarmId()));
            // Check ownership if farmer
            if (!isStaff && specificFarm.getFarmer() != null && specificFarm.getFarmer().getUser() != null
                    && !user.getId().equals(specificFarm.getFarmer().getUser().getId())) {
                throw new AccessDeniedException("You do not have permission to generate reports for this farm.");
            }
            targetFarms.add(specificFarm);
        } else {
            if (isStaff) {
                targetFarms = farmRepository.findAll();
            } else {
                Farmer farmer = farmerRepository.findByUser(user).orElse(null);
                if (farmer != null) {
                    targetFarms = farmRepository.findByFarmerId(farmer.getId());
                }
            }
        }

        // 2. Fetch Dependent Domain Telemetry
        List<Crop> crops;
        List<SoilData> soilRecords;
        List<DiseaseDetection> diseases;
        List<IrrigationSchedule> irrigations;

        if (specificFarm != null) {
            crops = cropRepository.findByFarmId(specificFarm.getId());
            soilRecords = soilDataRepository.findByFarmIdOrderByRecordedAtDesc(specificFarm.getId());
            diseases = diseaseDetectionRepository.findByFarmIdOrderByDetectedAtDesc(specificFarm.getId());
            irrigations = irrigationScheduleRepository.findByFarmIdOrderByStartTimeDesc(specificFarm.getId());
        } else {
            if (isStaff) {
                crops = cropRepository.findAll();
                soilRecords = soilDataRepository.findAll();
                diseases = diseaseDetectionRepository.findAllByOrderByDetectedAtDesc();
                irrigations = irrigationScheduleRepository.findAll();
            } else {
                crops = cropRepository.findAllByFarmerEmail(userEmail);
                soilRecords = soilDataRepository.findAllByFarmerEmail(userEmail);
                Farmer farmer = farmerRepository.findByUser(user).orElse(null);
                diseases = (farmer != null) ? diseaseDetectionRepository.findByFarmerOrderByDetectedAtDesc(farmer) : Collections.emptyList();
                irrigations = irrigationScheduleRepository.findByFarmerEmailOrderByStartTimeDesc(userEmail);
            }
        }

        // 3. Derive Report Title & Dynamic Synthesis Summary
        String farmTitle = (specificFarm != null) ? specificFarm.getFarmName() : "Multi-Zone Agricultural Operations";
        String reportType = request.getReportType() != null ? request.getReportType().toUpperCase() : "AGRONOMY_COMPREHENSIVE";
        String title = formatReportTitle(reportType, farmTitle);
        String summary = buildExecutiveSummary(reportType, farmTitle, targetFarms, crops, soilRecords, diseases, irrigations);
        String dateRange = (request.getDateRange() != null && !request.getDateRange().isBlank()) ? request.getDateRange() : "Last 30 Days";

        // 4. Construct Preliminary Report Entity
        ReportEntity report = ReportEntity.builder()
                .user(user)
                .farm(specificFarm)
                .reportTitle(title)
                .reportType(reportType)
                .dateRange(dateRange)
                .format("PDF")
                .status("READY")
                .summary(summary)
                .downloadCount(0)
                .generatedAt(LocalDateTime.now())
                .build();

        // 5. Generate Vector PDF Stream
        byte[] pdfBytes = pdfGeneratorService.generateAgronomyReport(
                report,
                targetFarms,
                crops,
                soilRecords,
                diseases,
                irrigations,
                request.getNotes()
        );

        // 6. Update entity with byte data and file size
        report.setPdfData(pdfBytes);
        report.setFileSize(String.format("%.1f KB", pdfBytes.length / 1024.0));

        ReportEntity saved = reportRepository.save(report);
        return mapToResponse(saved);
    }

    public List<ReportDTO.ReportResponse> getReports(String userEmail, String typeFilter) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isStaff = role.contains("ADMIN") || role.contains("AGRONOMIST");

        List<ReportEntity> list;
        if (isStaff) {
            if (typeFilter != null && !typeFilter.isBlank() && !"ALL".equalsIgnoreCase(typeFilter)) {
                list = reportRepository.findAllByReportTypeOrderByGeneratedAtDesc(typeFilter.toUpperCase());
            } else {
                list = reportRepository.findAllByOrderByGeneratedAtDesc();
            }
        } else {
            if (typeFilter != null && !typeFilter.isBlank() && !"ALL".equalsIgnoreCase(typeFilter)) {
                list = reportRepository.findByUserAndReportTypeOrderByGeneratedAtDesc(user, typeFilter.toUpperCase());
            } else {
                list = reportRepository.findByUserOrderByGeneratedAtDesc(user);
            }
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ReportEntity getReportEntity(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        ReportEntity report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + id));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isStaff = role.contains("ADMIN") || role.contains("AGRONOMIST");

        if (!isStaff && !report.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view this report.");
        }

        return report;
    }

    @Transactional
    public byte[] downloadReportPdf(Long id, String userEmail) {
        ReportEntity report = getReportEntity(id, userEmail);
        report.setDownloadCount(report.getDownloadCount() != null ? report.getDownloadCount() + 1 : 1);
        reportRepository.save(report);
        return report.getPdfData();
    }

    public byte[] previewReportPdf(Long id, String userEmail) {
        ReportEntity report = getReportEntity(id, userEmail);
        return report.getPdfData();
    }

    @Transactional
    public void deleteReport(Long id, String userEmail) {
        ReportEntity report = getReportEntity(id, userEmail);
        reportRepository.delete(report);
    }

    public ReportDTO.ReportStatsResponse getReportStats(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isStaff = role.contains("ADMIN") || role.contains("AGRONOMIST");

        List<ReportEntity> list = isStaff ? reportRepository.findAll() : reportRepository.findByUserOrderByGeneratedAtDesc(user);

        long total = list.size();
        long comp = list.stream().filter(r -> "AGRONOMY_COMPREHENSIVE".equalsIgnoreCase(r.getReportType())).count();
        long soil = list.stream().filter(r -> "SOIL_NUTRIENT".equalsIgnoreCase(r.getReportType())).count();
        long disease = list.stream().filter(r -> "DISEASE_SURVEILLANCE".equalsIgnoreCase(r.getReportType())).count();
        long irrigation = list.stream().filter(r -> "IRRIGATION_EFFICIENCY".equalsIgnoreCase(r.getReportType())).count();
        long downloads = list.stream().mapToLong(r -> r.getDownloadCount() != null ? r.getDownloadCount() : 0).sum();

        return ReportDTO.ReportStatsResponse.builder()
                .totalReports(total)
                .comprehensiveCount(comp)
                .soilCount(soil)
                .diseaseCount(disease)
                .irrigationCount(irrigation)
                .totalDownloads(downloads)
                .build();
    }

    private String formatReportTitle(String type, String farmName) {
        switch (type) {
            case "SOIL_NUTRIENT":
                return "Soil Health & Nutrient Telemetry Analysis - " + farmName;
            case "DISEASE_SURVEILLANCE":
                return "Phytosanitary & Disease Surveillance Report - " + farmName;
            case "IRRIGATION_EFFICIENCY":
                return "Precision Water Balance & Irrigation Audit - " + farmName;
            case "CROP_CYCLE_SUMMARY":
                return "Crop Phenology & Seasonal Cycle Summary - " + farmName;
            default:
                return "Comprehensive Agronomy & Field Health Dossier - " + farmName;
        }
    }

    private String buildExecutiveSummary(
            String type,
            String farmName,
            List<Farm> farms,
            List<Crop> crops,
            List<SoilData> soils,
            List<DiseaseDetection> diseases,
            List<IrrigationSchedule> irrigations
    ) {
        long activeDiseases = diseases.stream().filter(d -> "Active".equalsIgnoreCase(d.getStatus())).count();
        double avgPh = soils.isEmpty() ? 0.0 : soils.stream().mapToDouble(s -> s.getPhLevel() != null ? s.getPhLevel() : 0.0).average().orElse(0.0);
        long completedIrrigation = irrigations.stream().filter(i -> "Completed".equalsIgnoreCase(i.getStatus())).count();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Agronomic telemetry audit for %s spanning %d registered cultivation plots and %d crop varieties. ", farmName, farms.size(), crops.size()));

        if (activeDiseases > 0) {
            sb.append(String.format("Phytopathology surveillance flagged %d active disease incidents requiring targeted biosecurity intervention. ", activeDiseases));
        } else {
            sb.append("Phytopathology monitoring confirms zero critical disease outbreaks across audited plots. ");
        }

        if (avgPh > 0) {
            sb.append(String.format("Soil chemistry exhibits a mean pH index of %.2f, indicating %s growing conditions. ",
                    avgPh, (avgPh >= 6.0 && avgPh <= 7.5 ? "optimal neutral" : "acidic/alkaline skewed")));
        }

        sb.append(String.format("Water management automated %d irrigation cycles ensuring calculated soil moisture thresholds.", completedIrrigation));
        return sb.toString();
    }

    private ReportDTO.ReportResponse mapToResponse(ReportEntity entity) {
        return ReportDTO.ReportResponse.builder()
                .id(entity.getId())
                .reportTitle(entity.getReportTitle())
                .reportType(entity.getReportType())
                .dateRange(entity.getDateRange())
                .format(entity.getFormat())
                .fileSize(entity.getFileSize())
                .status(entity.getStatus())
                .summary(entity.getSummary())
                .downloadCount(entity.getDownloadCount())
                .generatedAt(entity.getGeneratedAt())
                .farmName(entity.getFarmName())
                .generatedByName(entity.getGeneratedByName())
                .build();
    }
}
