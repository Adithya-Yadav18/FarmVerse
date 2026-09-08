package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CropSimulationDTO;
import com.farmverse.backend.service.CropSimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
public class CropSimulationController {

    private final CropSimulationService simulationService;

    public CropSimulationController(CropSimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<CropSimulationDTO.SimulationResultResponse> calculateSimulation(
            @RequestBody CropSimulationDTO.SimulationRunRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(simulationService.calculateSimulation(request, authentication.getName()));
    }

    @PostMapping("/save")
    public ResponseEntity<CropSimulationDTO.SimulationResultResponse> saveSimulation(
            @RequestBody CropSimulationDTO.SimulationRunRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(simulationService.saveSimulation(request, authentication.getName()));
    }

    @GetMapping("/farms/{farmId}/saved")
    public ResponseEntity<List<CropSimulationDTO.SavedScenarioSummaryDto>> getSavedSimulations(
            @PathVariable Long farmId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(simulationService.getSavedSimulations(farmId, authentication.getName()));
    }

    @GetMapping("/presets")
    public ResponseEntity<List<CropSimulationDTO.SimulationPresetDto>> getPresets() {
        return ResponseEntity.ok(simulationService.getPresets());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSimulation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        simulationService.deleteSimulation(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Simulation deleted successfully", "id", id.toString()));
    }
}
