package com.farmverse.backend.controller;

import com.farmverse.backend.dto.UserSettingsDTO;
import com.farmverse.backend.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDTO.SettingsResponse> getSettings(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(settingsService.getSettings(email));
    }

    @PutMapping
    public ResponseEntity<UserSettingsDTO.SettingsResponse> updateSettings(
            Principal principal,
            @RequestBody UserSettingsDTO.UpdateSettingsRequest request) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(settingsService.updateSettings(email, request));
    }
}
