package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "produce_batches")
public class ProduceBatchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique Batch Tracking Identifier, e.g. "FV-2026-8819"
    @Column(nullable = false, unique = true, length = 64)
    private String batchCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private Farmer farmer;

    // Commodity details
    @Column(nullable = false)
    private String commodity;

    private String variety;

    // Harvest quantity in kilograms
    private Double quantityKg;

    // Lifecycle dates
    private LocalDate sowingDate;

    @Column(nullable = false)
    private LocalDate harvestDate;

    private LocalDate packagingDate;

    private LocalDate expiryDate;

    // Agronomic Practice: "100% Certified Organic", "Integrated Pest Management (IPM)", "Regenerative Natural Farming", "Hydroponic Greenhouse"
    private String farmingPractice;

    // Soil profile at cultivation
    private String soilType;

    // Irrigation & Water profile
    private String waterSource;

    // Satellite NDVI telemetry rating at harvest time (e.g. "High Canopy Vigour (NDVI 0.74)")
    private String satelliteVigourRating;

    // AI Pathology scan audit (e.g. "Zero Pathogens Detected (AI Verified)")
    private String diseaseStatus;

    // Agronomist certification fields
    @Builder.Default
    private Boolean agronomistCertified = false;

    private String agronomistName;

    @Column(length = 1000)
    private String agronomistNotes;

    // Certification badge seal: "FarmVerse Grade A Green Seal", "FSSAI Organic Benchmark", "Export Quality Tier 1"
    private String certificationSeal;

    // Batch Status: "ACTIVE", "IN_TRANSIT", "DELIVERED", "RECALLED"
    @Builder.Default
    private String status = "ACTIVE";

    // Base64 Data URL of the generated 2D QR Code image
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String qrDataUrl;

    // SHA-256 Tamper-Evident Digital Cryptographic Seal
    @Column(length = 128)
    private String cryptographicHash;

    // Public scan and engagement counter
    @Builder.Default
    private Long scanCount = 0L;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.scanCount == null) {
            this.scanCount = 0L;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
