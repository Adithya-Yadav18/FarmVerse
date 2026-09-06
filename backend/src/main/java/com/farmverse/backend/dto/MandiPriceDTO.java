package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

public class MandiPriceDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MandiPriceResponse {
        private Long id;
        private String commodity;
        private String variety;
        private String category;
        private String mandiName;
        private String district;
        private String state;
        private Double minPrice;
        private Double maxPrice;
        private Double modalPrice;
        private Double mspPrice;
        private Double mspSpread; // modalPrice - mspPrice (positive = above MSP, negative = below MSP)
        private Double priceChangePercent;
        private String trend; // UP, DOWN, STABLE
        private Double arrivalsTonnes;
        private Double distanceKm;
        private LocalDate recordedDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArbitrageRequest {
        private Long farmId;
        private String commodity;
        private Double quantityQuintals; // 1 quintal = 100 kg
        private Double originLat;
        private Double originLng;
        private String originMandiName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArbitrageOption {
        private String mandiName;
        private String district;
        private String state;
        private Double distanceKm;
        private Double modalPrice;
        private Double transportCostPerQuintal;
        private Double grossRevenue;
        private Double totalTransportCost;
        private Double netProfit;
        private Double netPricePerQuintal;
        private Boolean isRecommended;
        private String recommendationReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArbitrageResponse {
        private String farmName;
        private String farmLocation;
        private String commodity;
        private Double quantityQuintals;
        private String localMandiName;
        private Double localNetProfit;
        private String recommendedMandiName;
        private Double recommendedNetProfit;
        private Double additionalProfit;
        private Double percentageGain;
        private List<ArbitrageOption> mandiOptions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommodityPriceHistoryDto {
        private String date;
        private Double modalPrice;
        private Double mspPrice;
        private Double volumeTonnes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketSummaryStatsDto {
        private long totalMandisCovered;
        private long totalCommoditiesTracked;
        private List<MandiPriceResponse> topGainers;
        private List<MandiPriceResponse> topLosers;
        private Double avgModalPrice;
        private String marketSentiment; // Bullish, Stable, Bearish
        private String lastSyncedAt;
    }
}
