package com.farmverse.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "iot_devices")
public class IoTDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String deviceId; // e.g. FV-IOT-ESP32-7719

    private String deviceName; // e.g. Main Tube-well ESP32 Relay

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore
    private Farm farm;

    private String zone; // e.g. Zone A - Wheat Field

    private String hardwareModel; // ESP32 Wi-Fi Relay, 4G GSM Motor Starter, LoRaWAN Field Node

    private String deviceSecret; // fv_sec_...

    private String status; // ONLINE, STANDBY, OFFLINE

    private String relayState; // OPEN (OFF), CLOSED (ON)

    private Integer signalStrengthDbm; // e.g. -64 dBm

    private Double lineVoltage; // e.g. 230.5 V

    private Double flowRateLpm; // e.g. 53.0 L/min

    private String firmwareVersion; // e.g. v2.4.1-fv

    private LocalDateTime lastPing;

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
}
