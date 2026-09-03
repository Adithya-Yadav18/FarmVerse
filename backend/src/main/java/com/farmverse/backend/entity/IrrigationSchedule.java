package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "irrigation_schedules")
public class IrrigationSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore
    private Farm farm;

    private String zone;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    private Integer durationMinutes;

    private Integer waterVolumeLiters;

    private String status; // Scheduled, Active, Paused, Completed

    private String method; // Drip, Sprinkler, Flood, Center Pivot

    private Boolean automated; // IoT Smart Trigger

    private Double moistureThreshold; // Soil moisture trigger % to auto-skip

    private LocalDateTime createdAt;

    @Transient
    @JsonProperty("farmId")
    public Long getFarmId() {
        return farm != null ? farm.getId() : null;
    }

    @Transient
    @JsonProperty("farmName")
    public String getFarmName() {
        return farm != null ? farm.getFarmName() : "Target Farm";
    }

    @Transient
    @JsonProperty("duration")
    public Integer getDuration() {
        return durationMinutes;
    }

    @Transient
    @JsonProperty("waterVolume")
    public Integer getWaterVolume() {
        return waterVolumeLiters;
    }
}
