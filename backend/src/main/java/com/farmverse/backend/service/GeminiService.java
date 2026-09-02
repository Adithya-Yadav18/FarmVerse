package com.farmverse.backend.service;

import com.farmverse.backend.entity.SoilData;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Collections;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-3.5-flash-lite}")
    private String model;

    public GeminiService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Generates an AI-based agricultural recommendation for given soil data.
     * Uses Google Gemini LLM with an automatic fallback if the API is offline or key is not provided.
     */
    public String generateSoilRecommendation(SoilData soil, String farmName) {
        if (isInvalidOrAllZero(soil)) {
            return "⚠️ Incomplete or invalid soil metrics detected (all zero values). Please enter realistic soil test values (e.g., pH between 4.0 - 9.0, positive N-P-K nutrient percentages, and soil moisture) to receive an accurate agronomic analysis and recommendation.";
        }

        if (apiKey == null || apiKey.trim().isEmpty() || "your_gemini_api_key_here".equalsIgnoreCase(apiKey.trim())) {
            logger.warn("Gemini API key is not configured. Falling back to built-in smart recommendation engine.");
            return getFallbackRecommendation(soil);
        }

        try {
            String prompt = buildPrompt(soil, farmName);
            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    model != null && !model.isBlank() ? model : "gemini-3.5-flash-lite",
                    apiKey.trim()
            );

            // Construct Gemini request body
            Map<String, Object> textPart = Collections.singletonMap("text", prompt);
            Map<String, Object> partsObj = Collections.singletonMap("parts", Collections.singletonList(textPart));
            Map<String, Object> requestBody = Collections.singletonMap("contents", Collections.singletonList(partsObj));

            String requestJson = objectMapper.writeValueAsString(requestBody);

            String responseBody = webClient.post()
                    .uri(url)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestJson)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(25))
                    .block();

            if (responseBody != null) {
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode parts = candidates.get(0).path("content").path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        String aiText = parts.get(0).path("text").asText();
                        if (aiText != null && !aiText.isBlank()) {
                            return cleanAiText(aiText.trim());
                        }
                    }
                }
            }

            logger.warn("Received empty or unexpected response from Gemini API. Using fallback recommendation.");
            return getFallbackRecommendation(soil);

        } catch (Exception e) {
            logger.error("Error communicating with Gemini API: {}. Using smart fallback recommendation.", e.getMessage());
            return getFallbackRecommendation(soil);
        }
    }

    private String buildPrompt(SoilData soil, String farmName) {
        return String.format(
                "You are an expert agronomist and soil scientist for the FarmVerse smart agriculture platform.\n" +
                "Analyze the following soil test metrics recorded for farm '%s':\n" +
                "- pH Level: %s (Optimal range: 6.0 - 7.5)\n" +
                "- Nitrogen (N): %s%% (Optimal: >= 30%%)\n" +
                "- Phosphorus (P): %s%% (Optimal: >= 20%%)\n" +
                "- Potassium (K): %s%% (Optimal: >= 50%%)\n" +
                "- Organic Carbon: %s%% (Optimal: >= 2.5%%)\n" +
                "- Moisture: %s%% (Optimal: 40%% - 70%%)\n\n" +
                "Provide a concise, practical, and farmer-friendly recommendation (2 to 4 sentences maximum).\n" +
                "Directly specify:\n" +
                "1. Immediate corrective action needed for deficient or excessive nutrients/pH (mention specific remedies e.g., agricultural lime/gypsum, Urea, DAP, or MOP).\n" +
                "2. Moisture/irrigation adjustments and precautions to avoid root diseases or nutrient lockup.\n" +
                "Keep the response professional, encouraging, and easy to read without markdown headings (#) or bullet asterisks (*).",
                farmName != null ? farmName : "My Farm",
                soil.getPhLevel() != null ? soil.getPhLevel() : "N/A",
                soil.getNitrogen() != null ? soil.getNitrogen() : "N/A",
                soil.getPhosphorus() != null ? soil.getPhosphorus() : "N/A",
                soil.getPotassium() != null ? soil.getPotassium() : "N/A",
                soil.getOrganicCarbon() != null ? soil.getOrganicCarbon() : "N/A",
                soil.getMoisture() != null ? soil.getMoisture() : "N/A"
        );
    }

    private String cleanAiText(String text) {
        // Remove markdown formatting symbols if any
        return text.replaceAll("[#*`]", "").trim();
    }

    /**
     * Resilient smart rule engine used when external LLM API is unavailable.
     */
    public String getFallbackRecommendation(SoilData soil) {
        StringBuilder sb = new StringBuilder();

        // 1. pH Evaluation
        double ph = soil.getPhLevel() != null ? soil.getPhLevel() : 7.0;
        if (ph < 5.5) {
            sb.append("Critical soil acidity (pH ").append(ph).append("). Apply 2-3 tons/ha of agricultural lime to restore soil pH. ");
        } else if (ph < 6.0) {
            sb.append("Soil is slightly acidic (pH ").append(ph).append("). Apply 1 ton/ha of agricultural lime. ");
        } else if (ph > 7.8) {
            sb.append("Soil is alkaline (pH ").append(ph).append("). Apply gypsum or elemental sulfur to bring pH to optimal range. ");
        } else {
            sb.append("Soil pH (").append(ph).append(") is optimal for general crop nutrient uptake. ");
        }

        // 2. Macronutrients (N, P, K)
        double n = soil.getNitrogen() != null ? soil.getNitrogen() : 50;
        double p = soil.getPhosphorus() != null ? soil.getPhosphorus() : 50;
        double k = soil.getPotassium() != null ? soil.getPotassium() : 50;

        if (n < 20) {
            sb.append("Severe Nitrogen deficiency detected (").append(n).append("%); apply 50-70 kg/ha of Urea or nitrogen-rich compost. ");
        } else if (n < 30) {
            sb.append("Nitrogen is moderately low; supplement with 30-40 kg/ha Urea. ");
        }

        if (p < 20) {
            sb.append("Phosphorus is deficient; apply DAP (Di-ammonium Phosphate) or Rock Phosphate to boost root growth. ");
        }

        if (k < 35) {
            sb.append("Potassium levels are low; top-dress with MOP (Muriate of Potash) for disease resistance. ");
        }

        // 3. Organic Carbon
        double oc = soil.getOrganicCarbon() != null ? soil.getOrganicCarbon() : 2.5;
        if (oc < 1.5) {
            sb.append("Organic carbon is low; incorporate well-rotted farmyard manure or cover crops. ");
        }

        // 4. Moisture
        double moisture = soil.getMoisture() != null ? soil.getMoisture() : 50;
        if (moisture > 75) {
            sb.append("Soil moisture is excessively high (").append(moisture).append("%); enhance drainage immediately to prevent root rot.");
        } else if (moisture < 35) {
            sb.append("Soil moisture is low (").append(moisture).append("%); schedule irrigation to prevent crop dehydration.");
        } else {
            sb.append("Moisture level is well-balanced.");
        }

        return sb.toString().trim();
    }

    public boolean isInvalidOrAllZero(SoilData soil) {
        if (soil == null) return true;
        double ph = soil.getPhLevel() != null ? soil.getPhLevel() : 0.0;
        double n = soil.getNitrogen() != null ? soil.getNitrogen() : 0.0;
        double p = soil.getPhosphorus() != null ? soil.getPhosphorus() : 0.0;
        double k = soil.getPotassium() != null ? soil.getPotassium() : 0.0;
        double oc = soil.getOrganicCarbon() != null ? soil.getOrganicCarbon() : 0.0;
        double moisture = soil.getMoisture() != null ? soil.getMoisture() : 0.0;

        // If all parameters are zero or pH is 0 or outside realistic agricultural ranges (below 3.0 or above 11.0)
        return (ph <= 0.0 && n == 0.0 && p == 0.0 && k == 0.0 && oc == 0.0 && moisture == 0.0)
                || (ph <= 0.0 || ph > 14.0);
    }
}
