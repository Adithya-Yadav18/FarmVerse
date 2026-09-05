package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "satellite_ndvi_records")
public class SatelliteNdviEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false)
    private LocalDate captureDate;

    @Builder.Default
    private String satelliteSource = "Sentinel-2 L2A";

    @Builder.Default
    private Double cloudCoveragePercent = 1.8;

    @Column(nullable = false)
    private Double meanNdvi;

    private Double minNdvi;
    private Double maxNdvi;

    // Normalized Difference Water Index (NDWI) for canopy moisture stress
    private Double ndwiMoistureIndex;

    // Chlorophyll Absorption Ratio Index (CARI) for nitrogen/vigour
    private Double chlorophyllIndex;

    // Excellent, Healthy, Moderate Stress, Severe Stress
    @Column(nullable = false)
    private String canopyVigourRating;

    @Builder.Default
    private Boolean anomalyDetected = false;

    private String anomalyDetails;

    // Serialized JSON of 4x4 or 6x6 spatial sub-plot grid
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String gridDataJson;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonProperty("farmName")
    public String getFarmName() {
        return farm != null ? farm.getFarmName() : "Unknown Farm";
    }

    @JsonProperty("farmLocation")
    public String getFarmLocation() {
        return farm != null ? farm.getLocation() : "Unspecified";
    }
}
