package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

public class SatelliteNdviDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NdviGridCellDto {
        private int row;
        private int col;
        private String quadrantName; // e.g., "North-West (Zone A)"
        private double ndvi;
        private double ndwi;
        private double chlorophyll;
        private String status; // Optimal, Healthy, Stress, Critical
        private String color; // Hex color for false-color raster overlay
        private double[][] bounds; // [[southWestLat, southWestLng], [northEastLat, northEastLng]]
        private String recommendation; // Zone specific suggestion
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NdviRecordResponse {
        private Long id;
        private Long farmId;
        private String farmName;
        private String farmLocation;
        private Double centerLat;
        private Double centerLng;
        private LocalDate captureDate;
        private String satelliteSource;
        private Double cloudCoveragePercent;
        private Double meanNdvi;
        private Double minNdvi;
        private Double maxNdvi;
        private Double ndwiMoistureIndex;
        private Double chlorophyllIndex;
        private String canopyVigourRating;
        private Boolean anomalyDetected;
        private String anomalyDetails;
        private List<NdviGridCellDto> gridCells;
        private double[][] farmBounds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NdviHistoricalPointDto {
        private String date;
        private Double meanNdvi;
        private Double ndwi;
        private Integer vigourScore; // 0 to 100
        private String passLabel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SatelliteOverviewStatsDto {
        private long totalFarmsMonitored;
        private double averageCanopyNdvi;
        private long activeAnomaliesCount;
        private double highVigourPercentage;
        private int satellitePassCadenceDays;
        private String lastSatellitePass;
        private String satelliteConstellation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicCanopyBadgeDto {
        private String farmName;
        private String location;
        private String primaryCrop;
        private String canopyVigourRating;
        private Double meanNdvi;
        private Boolean certifiedSustainable;
        private String verificationHash;
        private String verifiedDate;
    }
}
