package com.farmverse.backend.controller;

import com.farmverse.backend.dto.FarmRequest;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.service.FarmService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
public class FarmController {

    private final FarmService farmService;

    public FarmController(FarmService farmService) {
        this.farmService = farmService;
    }

    // POST /api/farms - Add a new farm (Restricted to Farmer & Admin)
    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<Farm> addFarm(@Valid @RequestBody FarmRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        Farm newFarm = farmService.addFarm(userEmail, request);
        return ResponseEntity.ok(newFarm);
    }

    // GET /api/farms - Get farms (Farmer sees own, Agronomist & Admin see all)
    @GetMapping
    @PreAuthorize("hasAnyRole('FARMER', 'AGRONOMIST', 'ADMIN')")
    public ResponseEntity<List<Farm>> getFarms() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        List<Farm> farms = farmService.getFarmsByUserRole(userEmail);
        return ResponseEntity.ok(farms);
    }

    // GET /api/farms/{id} - Get single farm details
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'AGRONOMIST', 'ADMIN')")
    public ResponseEntity<Farm> getFarmById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return ResponseEntity.ok(farmService.getFarmById(id, userEmail));
    }

    // PUT /api/farms/{id} - Update an existing farm (Owner Farmer or Admin)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<Farm> updateFarm(@PathVariable Long id, @Valid @RequestBody FarmRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        Farm updatedFarm = farmService.updateFarm(id, userEmail, request);
        return ResponseEntity.ok(updatedFarm);
    }

    // DELETE /api/farms/{id} - Delete a farm (Owner Farmer or Admin)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<String> deleteFarm(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        farmService.deleteFarm(id, userEmail);
        return ResponseEntity.ok("Farm deleted successfully");
    }
}