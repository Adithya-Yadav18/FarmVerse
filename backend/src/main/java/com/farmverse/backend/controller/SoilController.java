package com.farmverse.backend.controller;

import com.farmverse.backend.dto.SoilRequest;
import com.farmverse.backend.entity.SoilData;
import com.farmverse.backend.service.SoilService;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<SoilData> addSoilData(@RequestBody SoilRequest request) {
        try {
            SoilData response = soilService.addSoilData(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<SoilData>> getMySoilData() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(soilService.getSoilDataForUser(email));
    }

    @DeleteMapping("/{id}")
 public ResponseEntity<String> deleteSoilData(@PathVariable Long id) {
     try {
         soilService.deleteSoilData(id);
         return ResponseEntity.ok("Soil analysis deleted successfully");
     } catch (RuntimeException e) {
         return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}