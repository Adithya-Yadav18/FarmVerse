package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CropRequest;
import com.farmverse.backend.entity.Crop;
import com.farmverse.backend.service.CropService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    // GET /api/crops - Get crops (Farmer sees own, Agronomist & Admin see all)
    @GetMapping
    @PreAuthorize("hasAnyRole('FARMER', 'AGRONOMIST', 'ADMIN')")
    public ResponseEntity<List<Crop>> getMyCrops() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(cropService.getCropsByUserRole(email));
    }

    // POST /api/crops - Add a crop (Farmer & Admin only)
    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<Crop> addCrop(@Valid @RequestBody CropRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        if (request.getFarmId() == null) {
            throw new IllegalArgumentException("Farm ID is required to register a crop cycle");
        }
        Crop newCrop = cropService.addCrop(request.getFarmId(), email, request);
        return ResponseEntity.ok(newCrop);
    }

    // PUT /api/crops/{id} - Update a crop (Owner Farmer or Admin)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<Crop> updateCrop(@PathVariable Long id, @Valid @RequestBody CropRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Crop updatedCrop = cropService.updateCrop(id, email, request);
        return ResponseEntity.ok(updatedCrop);
    }

    // DELETE /api/crops/{id} - Delete a crop (Owner Farmer or Admin)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<String> deleteCrop(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        cropService.deleteCrop(id, email);
        return ResponseEntity.ok("Crop deleted successfully");
    }
}