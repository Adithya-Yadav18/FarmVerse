package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String email; // NEW: Added email field
    private String phone;
    private String location;
}