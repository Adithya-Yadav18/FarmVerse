package com.farmverse.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class DiseaseTrackingDTO {

    @Data
    public static class AddTreatmentLogRequest {
        @NotBlank(message = "Treatment name or chemical compound is required")
        private String treatmentName;

        private String treatmentType; // CHEMICAL_FUNGICIDE, ORGANIC_BIOCONTROL, CULTURAL_PRUNING, NUTRITIONAL_BOOST

        private LocalDateTime treatmentDate;

        private String dosage; // e.g. 2.5 g/L, 500 ml/acre

        private Double costInr; // Cost of treatment

        @Min(value = 0, message = "Recovery percentage must be between 0 and 100")
        @Max(value = 100, message = "Recovery percentage must be between 0 and 100")
        private Integer recoveryPercentage; // 0 to 100

        private String followUpImageUrl; // Optional follow-up specimen photo

        private String notes; // Application observations
    }

    @Data
    public static class UpdateContainmentRequest {
        @NotBlank(message = "Containment status is required")
        private String containmentStatus; // CONTAINED, SPREADING, QUARANTINED, ERADICATED

        private String notes;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TrackingSummaryResponse {
        private Long totalCases;
        private Long activeInfections;
        private Long underTreatment;
        private Long resolvedCases;
        private Long quarantinedPlots;
        private Double averageRecoveryDays;
        private Double totalTreatmentSpendingInr;
        private Double containmentSuccessRate;
    }
}
