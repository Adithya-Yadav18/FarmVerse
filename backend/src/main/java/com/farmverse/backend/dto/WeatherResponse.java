package com.farmverse.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class WeatherResponse {
    private Current current;
    private List<Daily> daily;
    private List<Hourly> hourly;

    @Data
    public static class Current {
        private String cityName;
        private double temperature;
        private double feelsLike;
        private int humidity;
        private double windSpeed;
        private String windDirection;
        private double pressure;
        private double precipitation;
        private String description;
        private String emoji;
    }

    @Data
    public static class Daily {
        private String day;
        private double high;
        private double low;
        private String condition;
        private String emoji;
        private int rain;
    }

    @Data
    public static class Hourly {
        private String time;
        private double temp;
    }
}