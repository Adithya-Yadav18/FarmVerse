package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class IrrigationDTO {

    @Data
    public static class CreateScheduleRequest {
        @NotNull(message = "Farm ID is required")
        private Long farmId;

        @NotBlank(message = "Zone is required")
        private String zone;

        private LocalDateTime startTime;

        private Integer durationMinutes;

        private Integer waterVolumeLiters;

        private String method; // Drip, Sprinkler, Flood, Center Pivot

        private Boolean automated;

        private Double moistureThreshold;
    }

    @Data
    public static class UpdateStatusRequest {
        private String action; // start, pause, stop
        private String status; // Active, Paused, Completed, Scheduled
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatsResponse {
        private Long totalVolumeTodayLiters;
        private Integer activeZonesCount;
        private Long waterSavedLiters;
        private Double efficiencyScore;
        private Integer scheduledRunsCount;
    }

    @Data
    public static class PairDeviceRequest {
        @NotNull(message = "Farm ID is required")
        private Long farmId;

        @NotBlank(message = "Device Name is required")
        private String deviceName;

        private String zone;
        private String hardwareModel; // e.g. ESP32-WROOM-32D Wi-Fi Relay, 4G GSM SIM800L
        private String customDeviceId;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TestPulseResponse {
        private String deviceId;
        private String status;
        private String message;
        private Integer pulseDurationSeconds;
        private String relayState;
    }

    @Data
    public static class IoTTelemetryRequest {
        private Double lineVoltage;
        private Double flowRateLpm;
        private Double soilMoisture;
        private String relayState;
    }
}
