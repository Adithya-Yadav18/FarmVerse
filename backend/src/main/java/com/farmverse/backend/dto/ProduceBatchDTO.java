package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ProduceBatchDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBatchRequest {
        private Long farmId;
        private String commodity;
        private String variety;
        private Double quantityKg;
        private LocalDate sowingDate;
        private LocalDate harvestDate;
        private LocalDate packagingDate;
        private LocalDate expiryDate;
        private String farmingPractice; // "100% Certified Organic", "Integrated Pest Management", etc.
        private String soilType;
        private String waterSource;
        private String certificationSeal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchResponse {
        private Long id;
        private String batchCode;
        private Long farmId;
        private String farmName;
        private String farmLocation;
        private Double latitude;
        private Double longitude;
        private String farmerName;
        private String commodity;
        private String variety;
        private Double quantityKg;
        private LocalDate sowingDate;
        private LocalDate harvestDate;
        private LocalDate packagingDate;
        private LocalDate expiryDate;
        private String farmingPractice;
        private String soilType;
        private String waterSource;
        private String satelliteVigourRating;
        private String diseaseStatus;
        private Boolean agronomistCertified;
        private String agronomistName;
        private String agronomistNotes;
        private String certificationSeal;
        private String status;
        private String qrDataUrl;
        private String cryptographicHash;
        private Long scanCount;
        private Double avgRating;
        private Integer totalReviews;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicJourneyResponse {
        private String batchCode;
        private String commodity;
        private String variety;
        private Double quantityKg;
        private String status;
        private String farmingPractice;
        private LocalDate harvestDate;
        private LocalDate packagingDate;
        private LocalDate expiryDate;
        private String qrDataUrl;
        private String cryptographicHash;
        private Long scanCount;

        // Stage 1: Farm Origin & Terroir
        private FarmOriginDto origin;

        // Stage 2: Cultivation & Eco-Telemetry
        private CultivationDto cultivation;

        // Stage 3: Sentinel-2 Satellite Vigour & AI Disease Audit
        private QualityAuditDto qualityAudit;

        // Stage 4: Agronomist Endorsement
        private AgronomistEndorsementDto endorsement;

        // Stage 5: Consumer Trust & Reviews
        private Double avgRating;
        private Integer totalReviews;
        private List<ReviewDto> reviews;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmOriginDto {
        private Long farmId;
        private String farmName;
        private String location;
        private Double latitude;
        private Double longitude;
        private String farmerName;
        private String region;
        private Integer farmingExperienceYears;
        private String soilType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CultivationDto {
        private LocalDate sowingDate;
        private LocalDate harvestDate;
        private Integer growthDurationDays;
        private String waterSource;
        private String farmingPractice;
        private String weatherSummary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityAuditDto {
        private String satelliteVigourRating;
        private Double meanNdvi;
        private String diseaseStatus;
        private String labVerificationStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgronomistEndorsementDto {
        private Boolean certified;
        private String agronomistName;
        private String certificationSeal;
        private String notes;
        private String certifiedAtDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertifyBatchRequest {
        private String agronomistName;
        private String agronomistNotes;
        private String certificationSeal; // e.g. "FarmVerse Grade A Green Seal", "FSSAI Organic Benchmark"
        private Boolean approved;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecallBatchRequest {
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddReviewRequest {
        private String consumerName;
        private Integer rating;
        private String reviewText;
        private String consumerLocation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewDto {
        private Long id;
        private String consumerName;
        private Integer rating;
        private String reviewText;
        private String consumerLocation;
        private String createdAtFormatted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TraceabilitySummaryStatsDto {
        private long totalBatches;
        private long totalScans;
        private double certifiedOrganicPercent;
        private long activeRecalls;
        private long certifiedBatches;
    }
}
