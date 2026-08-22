package com.farmverse.backend.controller;

import com.farmverse.backend.dto.AuthResponse;
import com.farmverse.backend.dto.LoginRequest;
import com.farmverse.backend.dto.ProfileUpdateRequest;
import com.farmverse.backend.dto.RegisterRequest;
import com.farmverse.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerFarmer(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.registerFarmer(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginFarmer(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.loginFarmer(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

        // GET /api/auth/me - View Profile
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMyProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        
        AuthResponse response = authService.getProfile(userEmail);
        return ResponseEntity.ok(response);
    }

    // PUT /api/auth/profile - Update Profile
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateMyProfile(@RequestBody ProfileUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        
        AuthResponse response = authService.updateProfile(userEmail, request);
        return ResponseEntity.ok(response);
    }
}