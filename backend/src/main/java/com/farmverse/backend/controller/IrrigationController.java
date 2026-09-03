package com.farmverse.backend.controller;

import com.farmverse.backend.dto.IrrigationDTO;
import com.farmverse.backend.entity.IrrigationSchedule;
import com.farmverse.backend.service.IrrigationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/irrigation")
public class IrrigationController {

    private final IrrigationService irrigationService;

    public IrrigationController(IrrigationService irrigationService) {
        this.irrigationService = irrigationService;
    }

    @GetMapping
    public ResponseEntity<List<IrrigationSchedule>> getAllSchedules(Authentication auth) {
        return ResponseEntity.ok(irrigationService.getSchedules(auth.getName()));
    }

    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<IrrigationSchedule>> getSchedulesByFarm(
            @PathVariable Long farmId,
            Authentication auth) {
        return ResponseEntity.ok(irrigationService.getSchedulesByFarm(farmId, auth.getName()));
    }

    @PostMapping
    public ResponseEntity<IrrigationSchedule> createSchedule(
            @Valid @RequestBody IrrigationDTO.CreateScheduleRequest request,
            Authentication auth) {
        return ResponseEntity.ok(irrigationService.createSchedule(request, auth.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<IrrigationSchedule> updateStatus(
            @PathVariable Long id,
            @RequestBody IrrigationDTO.UpdateStatusRequest request,
            Authentication auth) {
        return ResponseEntity.ok(irrigationService.updateStatus(id, request.getAction(), request.getStatus(), auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long id,
            Authentication auth) {
        irrigationService.deleteSchedule(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<IrrigationDTO.StatsResponse> getStats(Authentication auth) {
        return ResponseEntity.ok(irrigationService.getStats(auth.getName()));
    }

    @GetMapping("/devices")
    public ResponseEntity<List<com.farmverse.backend.entity.IoTDevice>> getDevices(Authentication auth) {
        return ResponseEntity.ok(irrigationService.getDevices(auth.getName()));
    }

    @PostMapping("/devices/pair")
    public ResponseEntity<com.farmverse.backend.entity.IoTDevice> pairDevice(
            @Valid @RequestBody IrrigationDTO.PairDeviceRequest request,
            Authentication auth) {
        return ResponseEntity.ok(irrigationService.pairDevice(request, auth.getName()));
    }

    @PostMapping("/devices/{deviceId}/test-pulse")
    public ResponseEntity<IrrigationDTO.TestPulseResponse> testRelayPulse(
            @PathVariable String deviceId,
            Authentication auth) {
        return ResponseEntity.ok(irrigationService.testRelayPulse(deviceId, auth.getName()));
    }

    @DeleteMapping("/devices/{id}")
    public ResponseEntity<Void> deleteDevice(
            @PathVariable Long id,
            Authentication auth) {
        irrigationService.deleteDevice(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    // --- PHYSICAL IOT HARDWARE PROTOCOL ENDPOINTS (PUBLIC FOR MICROCONTROLLERS) ---

    @GetMapping("/iot/devices/{deviceId}/poll")
    public ResponseEntity<java.util.Map<String, Object>> pollHardware(
            @PathVariable String deviceId,
            @RequestParam(required = false) String token) {
        return ResponseEntity.ok(irrigationService.pollHardware(deviceId, token));
    }

    @PostMapping("/iot/devices/{deviceId}/telemetry")
    public ResponseEntity<com.farmverse.backend.entity.IoTDevice> ingestTelemetry(
            @PathVariable String deviceId,
            @RequestParam(required = false) String token,
            @RequestBody IrrigationDTO.IoTTelemetryRequest request) {
        return ResponseEntity.ok(irrigationService.ingestTelemetry(deviceId, token, request));
    }
}
