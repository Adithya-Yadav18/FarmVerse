package com.farmverse.backend.controller;

import com.farmverse.backend.dto.LoginRequest;
import com.farmverse.backend.dto.RegisterRequest;
import com.farmverse.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerFarmer(@RequestBody RegisterRequest request) {
        try {
            String response = authService.registerFarmer(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // NEW: The Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<String> loginFarmer(@RequestBody LoginRequest request) {
        try {
            String response = authService.loginFarmer(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Returns 400 Bad Request if credentials are invalid
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}