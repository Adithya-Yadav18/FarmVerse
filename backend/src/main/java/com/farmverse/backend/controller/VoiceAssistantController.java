package com.farmverse.backend.controller;

import com.farmverse.backend.dto.VoiceAssistantDTO;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.UserRepository;
import com.farmverse.backend.service.VoiceAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceAssistantController {

    private final VoiceAssistantService voiceService;
    private final UserRepository userRepository;

    @PostMapping("/ask")
    public ResponseEntity<VoiceAssistantDTO.VoiceAdvisoryResponse> askVoiceAssistant(
            @RequestBody VoiceAssistantDTO.VoiceQueryRequest request,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(voiceService.ask(request, currentUser));
    }

    @GetMapping("/presets")
    public ResponseEntity<List<VoiceAssistantDTO.VoicePresetDto>> getPresets(
            @RequestParam(required = false, defaultValue = "hi") String lang
    ) {
        return ResponseEntity.ok(voiceService.getPresets(lang));
    }

    @GetMapping("/history")
    public ResponseEntity<List<VoiceAssistantDTO.VoiceHistoryDto>> getHistory(
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(voiceService.getHistory(currentUser));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        voiceService.deleteHistory(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return userRepository.findAll().stream().findFirst().orElse(null);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));
    }
}
