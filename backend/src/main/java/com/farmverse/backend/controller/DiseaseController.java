package com.farmverse.backend.controller;

import com.farmverse.backend.dto.AgronomistPrescriptionRequest;
import com.farmverse.backend.dto.DiseaseScanRequest;
import com.farmverse.backend.dto.DiseaseStatusUpdateRequest;
import com.farmverse.backend.entity.DiseaseDetection;
import com.farmverse.backend.service.DiseaseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diseases")
public class DiseaseController {

    private final DiseaseService diseaseService;

    public DiseaseController(DiseaseService diseaseService) {
        this.diseaseService = diseaseService;
    }

    @GetMapping
    public ResponseEntity<List<DiseaseDetection>> getDetections(Authentication auth) {
        return ResponseEntity.ok(diseaseService.getDetections(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiseaseDetection> getDetectionById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(diseaseService.getDetectionById(id, auth.getName()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSurveillanceStats(Authentication auth) {
        return ResponseEntity.ok(diseaseService.getSurveillanceStats(auth.getName()));
    }

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<DiseaseDetection> scanCropLeaf(@Valid @RequestBody DiseaseScanRequest request, Authentication auth) {
        return ResponseEntity.ok(diseaseService.scanAndDiagnose(auth.getName(), request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DiseaseDetection> updateStatus(@PathVariable Long id,
                                                         @Valid @RequestBody DiseaseStatusUpdateRequest request,
                                                         Authentication auth) {
        return ResponseEntity.ok(diseaseService.updateStatus(id, auth.getName(), request));
    }

    @PutMapping("/{id}/prescribe")
    @PreAuthorize("hasAnyRole('AGRONOMIST', 'ADMIN')")
    public ResponseEntity<DiseaseDetection> submitPrescription(@PathVariable Long id,
                                                               @Valid @RequestBody AgronomistPrescriptionRequest request,
                                                               Authentication auth) {
        return ResponseEntity.ok(diseaseService.submitPrescription(id, auth.getName(), request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> deleteDetection(@PathVariable Long id, Authentication auth) {
        diseaseService.deleteDetection(id, auth.getName());
        return ResponseEntity.ok(Map.of("message", "Disease detection record deleted successfully"));
    }
}
