package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "farm_credit_scores")
public class CreditScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false)
    private Integer score; // 300 - 900

    @Column(nullable = false)
    private String tier; // "PRIME_A", "SUPERIOR_B", "STANDARD_C", "HIGH_RISK_D"

    @Column(nullable = false)
    private Double soilHealthScore; // 0.0 - 100.0

    @Column(nullable = false)
    private Double satelliteNdviScore; // 0.0 - 100.0

    @Column(nullable = false)
    private Double harvestTraceabilityScore; // 0.0 - 100.0

    @Column(nullable = false)
    private Double waterResilienceScore; // 0.0 - 100.0

    @Column(nullable = false)
    private Double maxPreApprovedLimit; // in INR (e.g. 350000.0)

    @Column(nullable = false)
    private Boolean kccEligible; // Kisan Credit Card 4% interest subvention

    @Column(nullable = false)
    private Boolean agronomistEndorsed;

    private String agronomistName;

    @Column(length = 2000)
    private String agronomistNotes;

    @Column(length = 2000)
    private String recommendations;

    @Column(nullable = false)
    private LocalDateTime calculatedAt;
}
