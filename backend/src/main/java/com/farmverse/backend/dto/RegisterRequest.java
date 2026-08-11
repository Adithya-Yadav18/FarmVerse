package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name; // Changed from fullName to match frontend
    private String email;
    private String password;
    private String role; // Added to match frontend
    private String confirmPassword; // Added to match frontend
    
    // Kept these optional in case the frontend adds them later
    private String phoneNumber;
    private String region;
    private Integer farmingExperienceYears;
    private String preferredLanguage;
}