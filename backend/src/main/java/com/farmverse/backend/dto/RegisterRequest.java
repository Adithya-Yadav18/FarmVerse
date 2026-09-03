package com.farmverse.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email address is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "(?i)^(Farmer|Agronomist|Admin|Normal User|User)$", message = "Role must be Farmer, Agronomist, Admin, or Normal User")
    private String role;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    private String phoneNumber;
    private String region;
    private String location; // Direct location support
    private String adminPasscode; // Admin security gate
    private String specialization; // Agronomist license/specialization
    private Integer farmingExperienceYears;
    private String preferredLanguage;
}