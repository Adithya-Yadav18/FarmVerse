package com.farmverse.backend.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private Tokens tokens = new Tokens();
    private UserResponse user = new UserResponse(); // Changed from Object to UserResponse

    @Data
    public static class Tokens {
        private String accessToken;
        private String refreshToken = "dummy-refresh-token";
        private String tokenType = "Bearer";
    }

    // NEW: Inner class to hold user details
    @Data
    public static class UserResponse {
        private Long id;
        private String name;
        private String email;
        private String role;
    }
}