package com.farmverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class VoiceAssistantDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoiceQueryRequest {
        private String queryText; // Transcribed speech or typed question
        private String languageCode; // hi, kn, ta, te, mr, en
        private Long farmId;
        private String cropContext;
        private String category;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoiceAdvisoryResponse {
        private Long consultationId;
        private String transcribedQuery;
        private String detectedLanguage;
        private String languageCode;
        private String spokenResponse; // Clean text for speech synthesis
        private String writtenAdvisory; // Detailed markdown advisory
        private List<String> actionItems; // Action steps for farmer
        private List<String> suggestedNextQuestions; // Quick regional follow-ups
        private String category;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoicePresetDto {
        private String id;
        private String languageCode;
        private String category;
        private String promptText; // Regional script
        private String englishMeaning;
        private String icon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoiceHistoryDto {
        private Long id;
        private String languageCode;
        private String transcribedQuery;
        private String spokenResponse;
        private String writtenAdvisory;
        private String category;
        private Boolean isBookmarked;
        private LocalDateTime createdAt;
    }
}
