package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "crop_rescues")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropRescueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticketCode; // e.g. SOS-2026-8941

    private Long farmId;

    @Column(nullable = false)
    private String farmName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private User farmer;

    private String farmerName;

    private String farmerPhone;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private String emergencyType; // CHEMICAL_BURN_TOXICITY, FLOOD_WATERLOGGING, PEST_SWARM_ATTACK, HAILSTORM_PHYSICAL_DAMAGE, SEVERE_DROUGHT_WILT

    @Column(nullable = false)
    private String severityLevel; // CRITICAL_IMMEDIATE, HIGH_24H, MODERATE

    private Double affectedAcres;

    @Column(nullable = false)
    private String cropName;

    private String cropGrowthStage; // Vegetative, Flowering, Grain-Filling, Maturity

    @Column(columnDefinition = "TEXT")
    private String symptomsDescription;

    @Column(columnDefinition = "TEXT")
    private String firstAidAntidoteJson; // Array of immediate 4-hour action steps

    private String assignedAgronomistName;

    private String assignedAgronomistPhone;

    @Column(nullable = false)
    @Builder.Default
    private String status = "SOS_TRIGGERED"; // SOS_TRIGGERED, ANTIDOTE_DEPLOYED, AGRONOMIST_DISPATCHED, STABILIZED, RESOLVED

    private Double estimatedDamagePercent;

    private Double estimatedSalvagePercent;

    @Column(columnDefinition = "TEXT")
    private String claimDossierJson; // PMFBY pre-filled claim data

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private LocalDateTime triggeredAt;

    private LocalDateTime resolvedAt;
}
