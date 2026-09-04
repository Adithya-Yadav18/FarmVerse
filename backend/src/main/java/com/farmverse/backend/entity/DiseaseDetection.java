package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "disease_detections")
public class DiseaseDetection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore
    private Farm farm;

    @ManyToOne
    @JoinColumn(name = "crop_id", nullable = true)
    @JsonIgnore
    private Crop crop;

    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    @JsonIgnore
    private Farmer farmer;

    @JsonProperty("cropName")
    private String cropName;

    @JsonProperty("disease")
    private String diseaseName;

    private String pathogenType; // Fungal, Bacterial, Viral, Pest, Deficiency

    private Double confidence; // Percentage e.g. 92.5

    private String severity; // Low, Medium, High, Critical

    private Double affectedArea; // Estimated percentage of crop area affected

    @Column(columnDefinition = "LONGTEXT")
    private String treatment; // AI Treatment prescription & immediate remedies

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl; // Leaf scan photo URL or Base64

    private String status = "Detected"; // Detected, Treating, Resolved

    private Boolean agronomistVerified = false;

    @Column(columnDefinition = "TEXT")
    private String agronomistNotes;

    @Column(columnDefinition = "TEXT")
    private String agronomistPrescription;

    private String verifiedByAgronomistName;

    private String containmentStatus = "CONTAINED"; // CONTAINED, SPREADING, QUARANTINED, ERADICATED

    private String recoveryStage = "ACTIVE_INFECTION"; // ACTIVE_INFECTION, UNDER_TREATMENT, SIGNIFICANT_RECOVERY, RESOLVED_HEALTHY

    private Integer currentRecoveryPercentage = 0; // 0 to 100%

    private Double totalTreatmentCostInr = 0.0; // Total cost spent on treatments

    @Column(columnDefinition = "LONGTEXT")
    private String latestFollowUpImageUrl; // Most recent progress photo

    private LocalDateTime detectedAt;
    private LocalDateTime updatedAt;

    @Transient
    @JsonProperty("farmId")
    public Long getFarmId() {
        return farm != null ? farm.getId() : null;
    }

    @Transient
    @JsonProperty("farmName")
    public String getFarmName() {
        return farm != null ? farm.getFarmName() : "Unknown Farm";
    }

    @Transient
    @JsonProperty("cropId")
    public Long getCropId() {
        return crop != null ? crop.getId() : null;
    }

    @Transient
    @JsonProperty("farmerName")
    public String getFarmerName() {
        return farmer != null ? farmer.getFullName() : "Unknown Farmer";
    }
}
