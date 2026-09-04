package com.farmverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

public class AIAdvisoryDTO {

    @Data
    public static class RecommendationRequest {
        @NotNull(message = "Farm ID is required")
        private Long farmId;

        private String season; // e.g. Kharif, Rabi, Zaid, Annual
        private String preferredCrops; // Farmer can specify their own crops to analyze

        // Optional manual/custom soil parameters
        private Double customPh;
        private Double customNitrogen;
        private Double customPhosphorus;
        private Double customPotassium;
        private Double customMoisture;
    }

    @Data
    public static class ChatRequest {
        @NotBlank(message = "Question or prompt cannot be blank")
        private String message;

        private String contextHistory;
        private Long farmId; // optional context linking
    }

    @Data
    public static class ChatResponse {
        private String reply;
        private List<String> suggestions;

        public ChatResponse(String reply, List<String> suggestions) {
            this.reply = reply;
            this.suggestions = suggestions;
        }
    }

    @Data
    public static class AdoptCropRequest {
        @NotNull(message = "Farm ID is required")
        private Long farmId;

        @NotBlank(message = "Crop name is required")
        private String cropName;

        private String variety;
        private Double area;
        private String season;
    }
}
