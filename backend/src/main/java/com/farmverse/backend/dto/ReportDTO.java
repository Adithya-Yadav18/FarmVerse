package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ReportDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateReportRequest {
        private Long farmId;

        @NotBlank(message = "Report type is required")
        private String reportType; // AGRONOMY_COMPREHENSIVE, SOIL_NUTRIENT, DISEASE_SURVEILLANCE, IRRIGATION_EFFICIENCY, CROP_CYCLE_SUMMARY

        private String dateRange; // e.g., "Last 30 Days", "Current Season", "Annual 2026"

        private String notes; // Custom agronomist notes to include in PDF
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportResponse {
        private Long id;
        private String reportTitle;
        private String reportType;
        private String dateRange;
        private String format;
        private String fileSize;
        private String status;
        private String summary;
        private Integer downloadCount;
        private LocalDateTime generatedAt;
        private String farmName;
        private String generatedByName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportStatsResponse {
        private long totalReports;
        private long comprehensiveCount;
        private long soilCount;
        private long diseaseCount;
        private long irrigationCount;
        private long totalDownloads;
    }
}
