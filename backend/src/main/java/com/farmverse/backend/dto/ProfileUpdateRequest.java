package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String phoneNumber;
    private String region;
    private Integer farmingExperienceYears;
    private String preferredLanguage;
}