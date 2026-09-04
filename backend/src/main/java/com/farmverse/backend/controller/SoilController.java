package com.farmverse.backend.controller;

import com.farmverse.backend.dto.SoilRequest;
import com.farmverse.backend.entity.SoilData;
import com.farmverse.backend.service.SoilService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/soil")
public class SoilController {

    private final SoilService soilService;

    public SoilController(SoilService soilService) {
        this.soilService = soilService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'AGRONOMIST', 'ADMIN')")
    public ResponseEntity<SoilData> addSoilData(@Valid @RequestBody SoilRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        SoilData response = soilService.addSoilData(request, email);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FARMER', 'AGRONOMIST', 'ADMIN')")
    public ResponseEntity<List<SoilData>> getMySoilData() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(soilService.getSoilDataByUserRole(email));
    }

    @GetMapping("/farm/{farmId}")
    @PreAuthorize("hasAnyRole('FARMER', 'AGRONOMIST', 'ADMIN')")
    public ResponseEntity<List<SoilData>> getSoilDataByFarm(@PathVariable Long farmId) {
        return ResponseEntity.ok(soilService.getSoilDataByFarm(farmId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<String> deleteSoilData(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        soilService.deleteSoilData(id, email);
        return ResponseEntity.ok("Soil analysis deleted successfully");
    }
}