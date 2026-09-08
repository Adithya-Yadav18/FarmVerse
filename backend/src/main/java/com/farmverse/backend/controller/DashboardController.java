package com.farmverse.backend.controller;

import com.farmverse.backend.dto.DashboardDTO;
import com.farmverse.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO.StatsResponse> getStats(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(dashboardService.getStats(email));
    }

    @GetMapping("/yield-trend")
    public ResponseEntity<List<DashboardDTO.YieldTrendPoint>> getYieldTrend(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(dashboardService.getYieldTrend(email));
    }

    @GetMapping("/crop-distribution")
    public ResponseEntity<List<DashboardDTO.CropDistributionPoint>> getCropDistribution(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(dashboardService.getCropDistribution(email));
    }

    @GetMapping("/water-usage")
    public ResponseEntity<List<DashboardDTO.WaterUsagePoint>> getWaterUsage(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(dashboardService.getWaterUsage(email));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<DashboardDTO.ActivityItem>> getRecentActivity(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(dashboardService.getRecentActivities(email));
    }
}
