package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DashboardDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private long totalFarms;
        private long activeCrops;
        private long pendingAlerts;
        private double waterUsageKl;
        private double yieldForecastTonnes;
        private double farmHealthScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YieldTrendPoint {
        private String month;
        private double yield;
        private double target;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CropDistributionPoint {
        private String name;
        private double value;
        private double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WaterUsagePoint {
        private String week;
        private double usage;
        private double optimal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityItem {
        private String id;
        private String type;
        private String desc;
        private String time;
        private String color;
    }
}
