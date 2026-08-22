package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class ProfileResponse {
    // This wraps the user object inside a "data" JSON property
    private AuthResponse.UserResponse data;
    
    public ProfileResponse(AuthResponse.UserResponse user) {
        this.data = user;
    }
}