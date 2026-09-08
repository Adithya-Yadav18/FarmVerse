package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class UserSettingsDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettingsResponse {
        private Long id;
        private Long userId;
        private String userEmail;
        private boolean emailNotifications;
        private boolean pushNotifications;
        private boolean smsNotifications;
        private boolean alertNotifications;
        private boolean reportNotifications;
        private boolean weatherNotifications;
        private boolean twoFactorAuth;
        private boolean activityLog;
        private String themePreference;
        private String languagePreference;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateSettingsRequest {
        private Boolean emailNotifications;
        private Boolean pushNotifications;
        private Boolean smsNotifications;
        private Boolean alertNotifications;
        private Boolean reportNotifications;
        private Boolean weatherNotifications;
        private Boolean twoFactorAuth;
        private Boolean activityLog;
        private String themePreference;
        private String languagePreference;
    }
}
