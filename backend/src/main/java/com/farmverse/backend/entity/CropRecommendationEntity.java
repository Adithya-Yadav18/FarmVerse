package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "crop_recommendations")
public class CropRecommendationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore
    private Farm farm;

    private String cropName;

    private Integer suitabilityScore; // 0 to 100

    private Double expectedYield; // in metric tonnes per hectare (t/ha)

    private Double estimatedRevenue; // in INR (₹)

    private String waterRequirement; // Low, Medium, High

    private String soilRequirement; // e.g. Alluvial, Sandy Loam, Well-drained

    private String season; // e.g. Rabi (Oct-Mar), Kharif (Jun-Oct), Zaid (Mar-Jun)

    @Column(columnDefinition = "TEXT")
    private String reasons; // Stored as newline-separated or JSON string

    @Column(columnDefinition = "TEXT")
    private String risks; // Stored as newline-separated or JSON string

    private LocalDateTime generatedAt;

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
}
