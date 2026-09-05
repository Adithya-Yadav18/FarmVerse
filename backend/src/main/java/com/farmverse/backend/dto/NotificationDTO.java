package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class NotificationDTO {

    @Data
    public static class CreateNotificationRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Message is required")
        private String message;

        private String type = "info"; // info, warning, error, success
        private String category = "SYSTEM"; // DISEASE, SOIL, WEATHER, IRRIGATION, PRESCRIPTION, SYSTEM
        private String link;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UnreadCountResponse {
        private long unreadCount;
    }
}
