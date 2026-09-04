package com.farmverse.backend.service;

import com.farmverse.backend.dto.AIAdvisoryDTO;
import com.farmverse.backend.entity.*;
import com.farmverse.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class GeminiAdvisoryService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    private final FarmRepository farmRepo;
    private final SoilDataRepository soilRepo;
    private final CropRepository cropRepo;
    private final CropRecommendationRepository recRepo;
    private final UserRepository userRepo;
    private final FarmerRepository farmerRepo;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GeminiAdvisoryService(FarmRepository farmRepo,
                                 SoilDataRepository soilRepo,
                                 CropRepository cropRepo,
                                 CropRecommendationRepository recRepo,
                                 UserRepository userRepo,
                                 FarmerRepository farmerRepo) {
        this.farmRepo = farmRepo;
        this.soilRepo = soilRepo;
        this.cropRepo = cropRepo;
        this.recRepo = recRepo;
        this.userRepo = userRepo;
        this.farmerRepo = farmerRepo;
        this.webClient = WebClient.builder()
                .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public List<CropRecommendationEntity> generateRecommendations(AIAdvisoryDTO.RecommendationRequest request, String userEmail) {
        Long farmId = request.getFarmId();
        Farm farm = farmRepo.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with ID: " + farmId));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !farm.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only generate recommendations for your own farms.");
            }
        }

        // Retrieve latest soil chemistry data for this farm
        List<SoilData> soilTests = soilRepo.findByFarmIdOrderByRecordedAtDesc(farmId);
        SoilData latestSoil = soilTests.isEmpty() ? null : soilTests.get(0);

        String targetSeason = (request.getSeason() != null && !request.getSeason().isBlank()) ? request.getSeason() : "Upcoming Season (Rabi/Kharif)";

        List<CropRecommendationEntity> recs = null;

        // 1. Invoke Gemini AI if key is configured
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.startsWith("AQ.placeholder")) {
            try {
                recs = callGeminiForRecommendations(farm, latestSoil, targetSeason, request);
            } catch (Exception e) {
                System.err.println("Gemini crop recommendation call failed: " + e.getMessage());
            }
        }

        // 2. Fallback to agricultural expert knowledge engine if AI call fails
        if (recs == null || recs.isEmpty()) {
            recs = getExpertRuleBasedRecommendations(farm, latestSoil, targetSeason, request);
        }

        // Delete old recommendations for this farm and persist new ones
        recRepo.deleteByFarmId(farmId);

        for (CropRecommendationEntity r : recs) {
            r.setFarm(farm);
            r.setGeneratedAt(LocalDateTime.now());
            recRepo.save(r);
        }

        return recs;
    }

    public List<CropRecommendationEntity> getSavedRecommendations(Long farmId, String userEmail) {
        Farm farm = farmRepo.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with ID: " + farmId));
        return recRepo.findByFarmOrderBySuitabilityScoreDesc(farm);
    }

    @Transactional
    public Crop adoptCrop(AIAdvisoryDTO.AdoptCropRequest request, String userEmail) {
        Farm farm = farmRepo.findById(request.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("ROLE_FARMER".equals(user.getRole())) {
            Farmer farmer = farmerRepo.findByUser(user).orElse(null);
            if (farmer == null || !farm.getFarmer().getId().equals(farmer.getId())) {
                throw new SecurityException("Access denied: You can only adopt crops on your own farms.");
            }
        }

        Crop crop = new Crop();
        crop.setFarm(farm);
        crop.setCropName(request.getCropName());
        crop.setVariety(request.getVariety() != null && !request.getVariety().isBlank() ? request.getVariety() : "Certified High-Yield Hybrid");
        crop.setPlantingDate(LocalDate.now());
        crop.setExpectedHarvestDate(LocalDate.now().plusMonths(4)); // Standard ~120 day growth cycle
        crop.setStatus("Planted");
        crop.setArea(request.getArea() != null && request.getArea() > 0 ? request.getArea() : Math.min(farm.getTotalAreaAcres(), 2.5));
        crop.setCreatedAt(LocalDateTime.now());

        return cropRepo.save(crop);
    }

    public AIAdvisoryDTO.ChatResponse chatWithAdvisory(AIAdvisoryDTO.ChatRequest request, String userEmail) {
        User user = userRepo.findByEmail(userEmail).orElse(null);
        String role = user != null ? user.getRole().replace("ROLE_", "") : "Farmer";

        String farmContext = "";
        if (request.getFarmId() != null) {
            Farm farm = farmRepo.findById(request.getFarmId()).orElse(null);
            if (farm != null) {
                farmContext = String.format("Farm: %s, Location: %s, Soil: %s. ", farm.getFarmName(), farm.getLocation(), farm.getSoilType());
            }
        }

        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.startsWith("AQ.placeholder")) {
            try {
                return callGeminiChat(request.getMessage(), request.getContextHistory(), farmContext, role);
            } catch (Exception e) {
                System.err.println("Gemini Chat failed: " + e.getMessage());
            }
        }

        // Fallback intelligent response
        return getFallbackChatResponse(request.getMessage(), role);
    }

    private List<CropRecommendationEntity> callGeminiForRecommendations(Farm farm, SoilData soil, String season, AIAdvisoryDTO.RecommendationRequest req) {
        double ph = (req != null && req.getCustomPh() != null) ? req.getCustomPh() :
                     (soil != null && soil.getPhLevel() != null ? soil.getPhLevel() : 6.8);
        double n = (req != null && req.getCustomNitrogen() != null) ? req.getCustomNitrogen() :
                     (soil != null && soil.getNitrogen() != null ? soil.getNitrogen() : 45.0);
        double p = (req != null && req.getCustomPhosphorus() != null) ? req.getCustomPhosphorus() :
                     (soil != null && soil.getPhosphorus() != null ? soil.getPhosphorus() : 30.0);
        double k = (req != null && req.getCustomPotassium() != null) ? req.getCustomPotassium() :
                     (soil != null && soil.getPotassium() != null ? soil.getPotassium() : 50.0);
        double moisture = (req != null && req.getCustomMoisture() != null) ? req.getCustomMoisture() :
                     (soil != null && soil.getMoisture() != null ? soil.getMoisture() : 35.0);
        String soilType = farm.getSoilType() != null ? farm.getSoilType() : "Loamy Soil";
        String location = farm.getLocation() != null ? farm.getLocation() : "India";
        double area = farm.getTotalAreaAcres() != null ? farm.getTotalAreaAcres() : 5.0;

        String cropInstruction = (req != null && req.getPreferredCrops() != null && !req.getPreferredCrops().isBlank())
                ? "The farmer explicitly desires evaluation for their preferred crops: '" + req.getPreferredCrops() + "'. You MUST evaluate these preferred crops and include their suitability, yield, and revenue projections."
                : "Select the top 3 most suitable high-yield crops.";

        String prompt = String.format(
            "You are a master agricultural economist and agronomist for FarmVerse.\n" +
            "Analyze the following real farm data:\n" +
            "- Location: %s\n" +
            "- Farm Acreage: %.1f acres\n" +
            "- Soil Type: %s\n" +
            "- Soil Chemistry: pH %.1f, Nitrogen %.1f kg/ha, Phosphorus %.1f kg/ha, Potassium %.1f kg/ha, Moisture %.1f%%\n" +
            "- Season: %s\n" +
            "- Crop Request: %s\n\n" +
            "Provide the TOP 3 most suitable, high-yield, economically viable crops for this parcel.\n" +
            "Return ONLY a JSON array with exactly 3 objects matching this schema:\n" +
            "[\n" +
            "  {\n" +
            "    \"cropName\": \"Crop name (e.g. Wheat, Mustard, Tomato, Rice, Cotton, Chickpea)\",\n" +
            "    \"suitabilityScore\": 75 to 98,\n" +
            "    \"expectedYield\": expected yield in tonnes per hectare (e.g. 4.8),\n" +
            "    \"estimatedRevenue\": estimated total revenue in INR ₹ for this farm acreage,\n" +
            "    \"waterRequirement\": \"Low|Low-Medium|Medium|High\",\n" +
            "    \"soilRequirement\": \"Brief soil suitability description\",\n" +
            "    \"season\": \"Season name with months\",\n" +
            "    \"reasons\": [\"Why it matches the pH %.1f\", \"Why it matches NPK levels\", \"Climate fit\"],\n" +
            "    \"risks\": [\"Specific pest or disease risk to watch\", \"Weather vulnerability\"]\n" +
            "  }\n" +
            "]",
            location, area, soilType, ph, n, p, k, moisture, season, cropInstruction, ph
        );

        String endpoint = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            geminiModel, geminiApiKey
        );

        Map<String, Object> payload = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        String response = webClient.post()
                .uri(endpoint)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseRecommendationsJson(response);
    }

    private List<CropRecommendationEntity> parseRecommendationsJson(String rawResponse) {
        List<CropRecommendationEntity> list = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode candidate = root.path("candidates").get(0);
            String rawText = candidate.path("content").path("parts").get(0).path("text").asText();

            if (rawText.contains("```json")) {
                rawText = rawText.substring(rawText.indexOf("```json") + 7);
                if (rawText.contains("```")) {
                    rawText = rawText.substring(0, rawText.indexOf("```"));
                }
            } else if (rawText.contains("```")) {
                rawText = rawText.substring(rawText.indexOf("```") + 3);
                if (rawText.contains("```")) {
                    rawText = rawText.substring(0, rawText.indexOf("```"));
                }
            }

            JsonNode arr = objectMapper.readTree(rawText.trim());
            if (arr.isArray()) {
                for (JsonNode item : arr) {
                    CropRecommendationEntity entity = new CropRecommendationEntity();
                    entity.setCropName(item.path("cropName").asText());
                    entity.setSuitabilityScore(item.path("suitabilityScore").asInt(85));
                    entity.setExpectedYield(item.path("expectedYield").asDouble(3.5));
                    entity.setEstimatedRevenue(item.path("estimatedRevenue").asDouble(120000.0));
                    entity.setWaterRequirement(item.path("waterRequirement").asText("Medium"));
                    entity.setSoilRequirement(item.path("soilRequirement").asText("Loamy, well-drained"));
                    entity.setSeason(item.path("season").asText("Rabi (Oct-Mar)"));

                    List<String> reasons = new ArrayList<>();
                    if (item.has("reasons") && item.path("reasons").isArray()) {
                        for (JsonNode r : item.path("reasons")) reasons.add(r.asText());
                    }
                    entity.setReasons(String.join("\n", reasons));

                    List<String> risks = new ArrayList<>();
                    if (item.has("risks") && item.path("risks").isArray()) {
                        for (JsonNode r : item.path("risks")) risks.add(r.asText());
                    }
                    entity.setRisks(String.join("\n", risks));

                    list.add(entity);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini recommendation JSON: " + e.getMessage());
        }
        return list;
    }

    private List<CropRecommendationEntity> getExpertRuleBasedRecommendations(Farm farm, SoilData soil, String season, AIAdvisoryDTO.RecommendationRequest req) {
        double ph = (req != null && req.getCustomPh() != null) ? req.getCustomPh() :
                     (soil != null && soil.getPhLevel() != null ? soil.getPhLevel() : 6.8);
        double acres = farm.getTotalAreaAcres() != null ? farm.getTotalAreaAcres() : 5.0;

        List<CropRecommendationEntity> list = new ArrayList<>();

        String c1Name = "Wheat (HD-2967 / Sharbati)";
        String c2Name = "Mustard (Pusa Bold / Giriraj)";
        String c3Name = "Chickpea / Gram (Kabuli / Desi)";

        if (req != null && req.getPreferredCrops() != null && !req.getPreferredCrops().isBlank()) {
            String[] custom = req.getPreferredCrops().split("[,;/]+");
            if (custom.length > 0 && !custom[0].trim().isBlank()) c1Name = custom[0].trim();
            if (custom.length > 1 && !custom[1].trim().isBlank()) c2Name = custom[1].trim();
            if (custom.length > 2 && !custom[2].trim().isBlank()) c3Name = custom[2].trim();
        }

        CropRecommendationEntity r1 = new CropRecommendationEntity();
        r1.setCropName(c1Name);
        r1.setSuitabilityScore(ph >= 6.0 && ph <= 7.8 ? 94 : 82);
        r1.setExpectedYield(4.8);
        r1.setEstimatedRevenue(Math.round(acres * 32000.0 * 100.0) / 100.0);
        r1.setWaterRequirement("Low-Medium (3-4 cycles)");
        r1.setSoilRequirement("Alluvial, Sandy Loam, Well-drained");
        r1.setSeason(season != null ? season : "Rabi (Nov-Apr)");
        r1.setReasons("Current soil pH (" + ph + ") is in prime absorption range\nBalanced Nitrogen supports healthy tillering\nStrong local mandi market demand");
        r1.setRisks("Monitor for foliar rust during humid spells\nAvoid terminal heat stress during grain filling");
        list.add(r1);

        CropRecommendationEntity r2 = new CropRecommendationEntity();
        r2.setCropName(c2Name);
        r2.setSuitabilityScore(ph >= 6.2 && ph <= 8.0 ? 88 : 78);
        r2.setExpectedYield(2.1);
        r2.setEstimatedRevenue(Math.round(acres * 24000.0 * 100.0) / 100.0);
        r2.setWaterRequirement("Low (Drought resilient)");
        r2.setSoilRequirement("Light to medium loam");
        r2.setSeason(season != null ? season : "Rabi (Oct-Feb)");
        r2.setReasons("Thrives in low-to-moderate moisture conditions\nHigh oilseed MSP and strong spot market demand\nLow input cost with high return on investment");
        r2.setRisks("Aphid infestation during flowering\nSusceptible to early frost");
        list.add(r2);

        CropRecommendationEntity r3 = new CropRecommendationEntity();
        r3.setCropName(c3Name);
        r3.setSuitabilityScore(ph >= 6.0 && ph <= 7.5 ? 86 : 74);
        r3.setExpectedYield(1.9);
        r3.setEstimatedRevenue(Math.round(acres * 28000.0 * 100.0) / 100.0);
        r3.setWaterRequirement("Low (Deep taproot)");
        r3.setSoilRequirement("Well-aerated loam to clay loam");
        r3.setSeason(season != null ? season : "Rabi (Oct-Mar)");
        r3.setReasons("Atmospheric nitrogen-fixing legume restores soil health\nRequires minimal supplemental irrigation\nPremium market value for pulse crops");
        r3.setRisks("Pod borer (Helicoverpa armigera) during pod formation\nAvoid waterlogging");
        list.add(r3);

        return list;
    }

    private AIAdvisoryDTO.ChatResponse callGeminiChat(String message, String history, String farmContext, String role) {
        String prompt = String.format(
            "You are FarmVerse AI, a world-class agricultural advisor, agronomist, and farming assistant.\n" +
            "User Role: %s\n" +
            "Context: %s\n" +
            "Conversation History: %s\n" +
            "User Question: %s\n\n" +
            "Provide an insightful, practical, actionable agricultural response tailored to their role.\n" +
            "Include 3 relevant short follow-up questions they can ask.\n" +
            "Format your answer ONLY as a JSON object:\n" +
            "{\n" +
            "  \"reply\": \"Markdown formatted helpful answer with bullet points and bold highlights\",\n" +
            "  \"suggestions\": [\"Follow up question 1\", \"Follow up question 2\", \"Follow up question 3\"]\n" +
            "}",
            role, farmContext, history != null ? history : "None", message
        );

        String endpoint = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
            geminiModel, geminiApiKey
        );

        Map<String, Object> payload = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        String response = webClient.post()
                .uri(endpoint)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidate = root.path("candidates").get(0);
            String rawText = candidate.path("content").path("parts").get(0).path("text").asText();

            if (rawText.contains("```json")) {
                rawText = rawText.substring(rawText.indexOf("```json") + 7);
                if (rawText.contains("```")) rawText = rawText.substring(0, rawText.indexOf("```"));
            } else if (rawText.contains("```")) {
                rawText = rawText.substring(rawText.indexOf("```") + 3);
                if (rawText.contains("```")) rawText = rawText.substring(0, rawText.indexOf("```"));
            }

            JsonNode parsed = objectMapper.readTree(rawText.trim());
            String reply = parsed.path("reply").asText();
            List<String> suggestions = new ArrayList<>();
            if (parsed.has("suggestions") && parsed.path("suggestions").isArray()) {
                for (JsonNode s : parsed.path("suggestions")) suggestions.add(s.asText());
            }
            return new AIAdvisoryDTO.ChatResponse(reply, suggestions);
        } catch (Exception e) {
            return new AIAdvisoryDTO.ChatResponse(
                "Based on current agronomic practices, ensure soil moisture is maintained at 35-40% and apply balanced N-P-K nutrition tailored to your specific crop stage.",
                List.of("What is the best fertilizer timing?", "How to prevent pest infestation?", "What are good companion crops?")
            );
        }
    }

    private AIAdvisoryDTO.ChatResponse getFallbackChatResponse(String message, String role) {
        String msg = message.toLowerCase();
        String reply;
        List<String> suggestions;

        if (msg.contains("fertilizer") || msg.contains("urea") || msg.contains("npk")) {
            reply = "### Recommended Fertilizer & NPK Application Protocol\n" +
                    "- **Basal Dose**: Apply 50% Nitrogen, 100% Phosphorus, and 100% Potassium at sowing time to encourage root vigor.\n" +
                    "- **First Top Dressing**: Apply remaining Nitrogen (Urea) at first irrigation (crown root initiation stage, ~21-25 days after sowing).\n" +
                    "- **Micronutrients**: Spray Zinc Sulphate (0.5%) + Ferrous Sulphate (0.2%) if leaf yellowing (chlorosis) occurs.";
            suggestions = List.of("What about organic manure?", "How to test soil before fertilizing?", "Best irrigation timing after urea?");
        } else if (msg.contains("pest") || msg.contains("insect") || msg.contains("disease")) {
            reply = "### Integrated Pest & Disease Management (IPM)\n" +
                    "- **Monitoring**: Install yellow sticky traps (10 traps/acre) to detect whitefly and aphid thresholds.\n" +
                    "- **Biological Control**: Spray Neem oil (Azadirachtin 1500ppm) @ 3ml/L water at first sign of sucking pests.\n" +
                    "- **Chemical Action**: For fungal outbreaks, apply Mancozeb 75% WP @ 2.5g/L or Azoxystrobin @ 1ml/L.";
            suggestions = List.of("How to treat leaf curl virus?", "Organic pest repellent recipes", "Safe harvest waiting periods?");
        } else {
            reply = "### FarmVerse Agro-Advisory Guidance\n" +
                    "For optimal crop yield, align your planting schedule with regional temperature and soil moisture levels. " +
                    "Maintain soil organic carbon above 0.5% using compost or green manuring (Dhaincha/Sunn hemp) to enhance water retention and nutrient availability.";
            suggestions = List.of("Top crops for upcoming season", "How to improve soil organic carbon?", "Water saving irrigation methods");
        }

        return new AIAdvisoryDTO.ChatResponse(reply, suggestions);
    }
}
