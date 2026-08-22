package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CropRequest;
import com.farmverse.backend.entity.Crop;
import com.farmverse.backend.service.CropService;
import org.springframework.http.ResponseEntity;
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

    // GET /api/crops - Get all crops for logged-in user
    @GetMapping
    public ResponseEntity<List<Crop>> getMyCrops() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(cropService.getAllCropsForUser(email));
    }

    // POST /api/crops - Add a crop (farmId is inside the JSON body)
    @PostMapping
    public ResponseEntity<Crop> addCrop(@RequestBody CropRequest request) {
        if (request.getFarmId() == null) {
            return ResponseEntity.badRequest().body(null);
        }
        Crop newCrop = cropService.addCrop(request.getFarmId(), request);
        return ResponseEntity.ok(newCrop);
    }

    // PUT /api/crops/{id} - Update a crop
    @PutMapping("/{id}")
    public ResponseEntity<Crop> updateCrop(@PathVariable Long id, @RequestBody CropRequest request) {
        Crop updatedCrop = cropService.updateCrop(id, request);
        return ResponseEntity.ok(updatedCrop);
    }

    // DELETE /api/crops/{id} - Delete a crop
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCrop(@PathVariable Long id) {
        cropService.deleteCrop(id);
        return ResponseEntity.ok("Crop deleted successfully");
    }
}