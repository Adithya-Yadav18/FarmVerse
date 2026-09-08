package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CropSimulationDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationRunRequest {
        private Long farmId;
        private Long cropId;
        private String cropName; // e.g., "Wheat", "Rice", "Cotton", "Tomato", "Maize", "Sugarcane"
        private String scenarioName;
        private Integer waterAdjustmentPercent; // -50 to +50
        private Integer fertilizerAdjustmentPercent; // 0 to 200
        private Double temperatureOffset; // -3.0 to +5.0
        private Integer sowingShiftDays; // -15 to +30
        private String pestPressure; // NONE, LOW, MEDIUM, HIGH
        private String irrigationMethod; // FLOOD, DRIP, SPRINKLER, MULCH_DRIP
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationWeeklyPointDto {
        private Integer week;
        private String stageName;
        private Double baselineBiomass;
        private Double simulatedBiomass;
        private Double simulatedNdvi;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationResultResponse {
        private Long id;
        private Long farmId;
        private String farmName;
        private String cropName;
        private String scenarioName;
        private Double baselineYieldQuintals;
        private Double projectedYieldQuintals;
        private Double yieldChangePercent;
        private Double mandiPricePerQuintal;
        private Double inputCostPerAcre;
        private Double grossRevenuePerAcre;
        private Double netProfitPerAcre;
        private Double baselineNetProfitPerAcre;
        private Double profitChangePercent;
        private Integer resilienceIndex; // 0 - 100
        private String riskLevel; // LOW, MODERATE, SEVERE
        private Double waterConsumptionLitersPerAcre;
        private Double waterEfficiencyLitersPerKg;
        private String irrigationMethod;
        private List<SimulationWeeklyPointDto> weeklyGrowthCurve;
        private List<String> actionableAdvice;
        private List<String> riskWarnings;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SavedScenarioSummaryDto {
        private Long id;
        private Long farmId;
        private String scenarioName;
        private String cropName;
        private Double projectedYieldQuintals;
        private Double yieldChangePercent;
        private Double netProfitPerAcre;
        private Integer resilienceIndex;
        private String riskLevel;
        private String irrigationMethod;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationPresetDto {
        private String id;
        private String title;
        private String description;
        private String icon;
        private Integer waterAdjustmentPercent;
        private Integer fertilizerAdjustmentPercent;
        private Double temperatureOffset;
        private Integer sowingShiftDays;
        private String pestPressure;
        private String irrigationMethod;
    }
}
