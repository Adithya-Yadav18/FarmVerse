package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String phoneNumber;
    private String region;
    private Integer farmingExperienceYears;
    private String preferredLanguage;
}