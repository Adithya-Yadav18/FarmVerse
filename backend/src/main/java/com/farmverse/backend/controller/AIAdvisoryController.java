package com.farmverse.backend.controller;

import com.farmverse.backend.dto.AIAdvisoryDTO;
import com.farmverse.backend.entity.Crop;
import com.farmverse.backend.entity.CropRecommendationEntity;
import com.farmverse.backend.service.GeminiAdvisoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AIAdvisoryController {

    private final GeminiAdvisoryService advisoryService;

    public AIAdvisoryController(GeminiAdvisoryService advisoryService) {
        this.advisoryService = advisoryService;
    }

    @PostMapping("/recommendations")
    public ResponseEntity<List<CropRecommendationEntity>> generateRecommendations(
            @Valid @RequestBody AIAdvisoryDTO.RecommendationRequest request,
            Authentication auth) {
        return ResponseEntity.ok(advisoryService.generateRecommendations(request, auth.getName()));
    }

    @GetMapping("/recommendations/{farmId}")
    public ResponseEntity<List<CropRecommendationEntity>> getSavedRecommendations(
            @PathVariable Long farmId,
            Authentication auth) {
        return ResponseEntity.ok(advisoryService.getSavedRecommendations(farmId, auth.getName()));
    }

    @PostMapping("/adopt")
    public ResponseEntity<Crop> adoptCrop(
            @Valid @RequestBody AIAdvisoryDTO.AdoptCropRequest request,
            Authentication auth) {
        return ResponseEntity.ok(advisoryService.adoptCrop(request, auth.getName()));
    }

    @PostMapping("/chat")
    public ResponseEntity<AIAdvisoryDTO.ChatResponse> chatWithAdvisory(
            @Valid @RequestBody AIAdvisoryDTO.ChatRequest request,
            Authentication auth) {
        return ResponseEntity.ok(advisoryService.chatWithAdvisory(request, auth.getName()));
    }
}
