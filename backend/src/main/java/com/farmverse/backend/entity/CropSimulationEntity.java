package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "crop_simulations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropSimulationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    private Crop crop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private User farmer;

    @Column(nullable = false)
    private String cropName;

    @Column(nullable = false)
    private String scenarioName;

    private Integer waterAdjustmentPercent;

    private Integer fertilizerAdjustmentPercent;

    private Double temperatureOffset;

    private Integer sowingShiftDays;

    private String pestPressure; // NONE, LOW, MEDIUM, HIGH

    private String irrigationMethod; // FLOOD, DRIP, SPRINKLER, MULCH_DRIP

    private Double projectedYieldQuintals;

    private Double baselineYieldQuintals;

    private Double yieldChangePercent;

    private Double inputCostPerAcre;

    private Double grossRevenuePerAcre;

    private Double netProfitPerAcre;

    private Double profitChangePercent;

    private Integer resilienceIndex; // 0 - 100

    private String riskLevel; // LOW, MODERATE, SEVERE

    private Double waterConsumptionLitersPerAcre;

    @Column(columnDefinition = "TEXT")
    private String simulationDataJson; // 12-week biomass curve + agronomic tips JSON

    private LocalDateTime createdAt;
}
