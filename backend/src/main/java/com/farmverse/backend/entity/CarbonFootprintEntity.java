package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "farm_carbon_footprints")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarbonFootprintEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private User farmer;

    private Integer periodYear;

    // Emission Drivers
    private Double dieselUsageLiters; // 2.68 kg CO2e / L
    private Double syntheticFertilizerKg; // 5.80 kg CO2e / kg N
    private Double electricityKwh; // 0.82 kg CO2e / kWh
    private String tillageMethod; // CONVENTIONAL, REDUCED, NO_TILL
    private Boolean stubbleBurningAvoided; // true = avoided, false = burned

    // Sequestration Drivers
    private Boolean solarPumpInstalled; // offsets 100% of pump diesel/electricity
    private Boolean dripIrrigationActive; // reduces pumping energy by 35%
    private Double biocharCompostTons; // 1800 kg CO2e sequestered / ton
    private Integer agroforestryTreesCount; // 22 kg CO2e / tree / year
    private Double coverCroppingAcres; // 1200 kg CO2e / acre

    // Calculated Totals (in Kilograms of CO2 equivalent)
    private Double totalEmissionsKgCo2;
    private Double totalSequestrationKgCo2;
    private Double netCarbonKgCo2; // negative means net-sequestration (Carbon Negative / Green)

    // Minted Carbon Credits (1 Credit = 1 Tonne = 1000 kg CO2e sequestered/avoided)
    private Double carbonCreditsMinted;

    // Tier Rating: NET_NEGATIVE_A_PLUS, LOW_CARBON_A, BALANCED_B, CARBON_INTENSIVE_C
    private String carbonRating;

    @Column(columnDefinition = "TEXT")
    private String auditDetailsJson; // detailed breakdown of sources and recommendations

    private LocalDateTime createdAt;
}
