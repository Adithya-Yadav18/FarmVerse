package com.farmverse.backend.controller;

import com.farmverse.backend.dto.CropRescueDTO;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.UserRepository;
import com.farmverse.backend.service.CropRescueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rescue")
@RequiredArgsConstructor
public class CropRescueController {

    private final CropRescueService rescueService;
    private final UserRepository userRepository;

    @PostMapping("/sos")
    public ResponseEntity<CropRescueDTO.RescueTicketResponse> triggerSos(
            @RequestBody CropRescueDTO.TriggerSosRequest request,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(rescueService.triggerSos(request, currentUser));
    }

    @GetMapping("/tickets/my")
    public ResponseEntity<List<CropRescueDTO.RescueTicketResponse>> getMyTickets(
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(rescueService.getMyTickets(currentUser));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<CropRescueDTO.RescueTicketResponse> getTicketById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(rescueService.getTicketById(id));
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<CropRescueDTO.RescueTicketResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody CropRescueDTO.UpdateRescueStatusRequest request
    ) {
        return ResponseEntity.ok(rescueService.updateStatus(id, request));
    }

    @GetMapping("/presets")
    public ResponseEntity<List<CropRescueDTO.EmergencyCategoryPreset>> getEmergencyPresets() {
        return ResponseEntity.ok(rescueService.getEmergencyPresets());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return userRepository.findAll().stream().findFirst().orElse(null);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));
    }
}
