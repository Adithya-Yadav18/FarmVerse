package com.farmverse.backend.controller;

import com.farmverse.backend.dto.SatelliteNdviDTO;
import com.farmverse.backend.service.SatelliteNdviService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/satellite")
public class SatelliteNdviController {

    private final SatelliteNdviService satelliteService;

    public SatelliteNdviController(SatelliteNdviService satelliteService) {
        this.satelliteService = satelliteService;
    }

    @GetMapping("/farms/{farmId}/latest")
    public ResponseEntity<SatelliteNdviDTO.NdviRecordResponse> getLatestNdvi(
            @PathVariable Long farmId,
            Authentication auth
    ) {
        return ResponseEntity.ok(satelliteService.getLatestNdviForFarm(farmId, auth.getName()));
    }

    @PostMapping("/farms/{farmId}/scan")
    public ResponseEntity<SatelliteNdviDTO.NdviRecordResponse> triggerRescan(
            @PathVariable Long farmId,
            Authentication auth
    ) {
        return ResponseEntity.ok(satelliteService.triggerSatelliteRescan(farmId, auth.getName()));
    }

    @GetMapping("/farms/{farmId}/history")
    public ResponseEntity<List<SatelliteNdviDTO.NdviHistoricalPointDto>> getNdviHistory(
            @PathVariable Long farmId,
            Authentication auth
    ) {
        return ResponseEntity.ok(satelliteService.getNdviHistory(farmId, auth.getName()));
    }

    @GetMapping("/overview")
    public ResponseEntity<SatelliteNdviDTO.SatelliteOverviewStatsDto> getOverviewStats(Authentication auth) {
        return ResponseEntity.ok(satelliteService.getOverviewStats(auth.getName()));
    }

    @GetMapping("/public-badge/{farmId}")
    public ResponseEntity<SatelliteNdviDTO.PublicCanopyBadgeDto> getPublicBadge(@PathVariable Long farmId) {
        return ResponseEntity.ok(satelliteService.getPublicBadge(farmId));
    }
}
