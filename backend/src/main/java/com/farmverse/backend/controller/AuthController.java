package com.farmverse.backend.controller;

import com.farmverse.backend.dto.RegisterRequest;
import com.farmverse.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // Marks this as a REST API controller
@RequestMapping("/api/auth") // Base URL for all endpoints in this class
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Endpoint: POST http://localhost:8080/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<String> registerFarmer(@RequestBody RegisterRequest request) {
        try {
            String response = authService.registerFarmer(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // If email is already in use, return a 400 Bad Request
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}