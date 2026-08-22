package com.farmverse.backend.controller;

import com.farmverse.backend.dto.FarmRequest;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.service.FarmService;
import org.springframework.http.ResponseEntity;
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

    // POST /api/farms - Add a new farm for the logged-in farmer
    @PostMapping
    public ResponseEntity<Farm> addFarm(@RequestBody FarmRequest request) {
        // 1. Get the email of the currently logged-in user from the JWT token
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();

        // 2. Tell the service to add the farm for this user
        Farm newFarm = farmService.addFarm(userEmail, request);
        return ResponseEntity.ok(newFarm);
    }

    // GET /api/farms - Get all farms for the logged-in farmer
    @GetMapping
    public ResponseEntity<List<Farm>> getMyFarms() {
        // 1. Get the email from the JWT token
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();

        // 2. Fetch the farms
        List<Farm> farms = farmService.getFarmsByFarmer(userEmail);
        return ResponseEntity.ok(farms);
    }
}