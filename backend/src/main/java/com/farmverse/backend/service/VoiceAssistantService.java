package com.farmverse.backend.service;

import com.farmverse.backend.dto.VoiceAssistantDTO;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.entity.VoiceConsultationEntity;
import com.farmverse.backend.repository.UserRepository;
import com.farmverse.backend.repository.VoiceConsultationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoiceAssistantService {

    private final VoiceConsultationRepository voiceRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    @Transactional
    public VoiceAssistantDTO.VoiceAdvisoryResponse ask(VoiceAssistantDTO.VoiceQueryRequest request, User currentUser) {
        String lang = (request.getLanguageCode() != null && !request.getLanguageCode().trim().isEmpty())
                ? request.getLanguageCode().trim().toLowerCase()
                : "hi";

        String query = request.getQueryText() != null ? request.getQueryText().trim() : "";
        if (query.isEmpty()) {
            query = getDefaultPromptForLanguage(lang);
        }

        VoiceAssistantDTO.VoiceAdvisoryResponse response;

        // 1. Try Gemini LLM if key is present
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.startsWith("AQ.placeholder")) {
            try {
                response = callGeminiForVoice(query, lang, request.getCropContext());
            } catch (Exception e) {
                log.warn("Gemini Voice API call failed: {}. Falling back to multi-lingual agronomy engine.", e.getMessage());
                response = generateFallbackAdvisory(query, lang);
            }
        } else {
            response = generateFallbackAdvisory(query, lang);
        }

        // 2. Persist voice consultation
        VoiceConsultationEntity entity = VoiceConsultationEntity.builder()
                .user(currentUser)
                .farmId(request.getFarmId())
                .languageCode(lang)
                .transcribedQuery(query)
                .spokenResponse(response.getSpokenResponse())
                .writtenAdvisory(response.getWrittenAdvisory())
                .category(request.getCategory() != null ? request.getCategory() : "AGRONOMY_VOICE")
                .audioLengthSeconds(12)
                .createdAt(LocalDateTime.now())
                .build();

        VoiceConsultationEntity saved = voiceRepository.save(entity);
        response.setConsultationId(saved.getId());

        return response;
    }

    public List<VoiceAssistantDTO.VoicePresetDto> getPresets(String languageCode) {
        String lang = languageCode != null ? languageCode.toLowerCase() : "hi";
        return getRegionalPresets(lang);
    }

    @Transactional(readOnly = true)
    public List<VoiceAssistantDTO.VoiceHistoryDto> getHistory(User currentUser) {
        if (currentUser == null) {
            return Collections.emptyList();
        }
        return voiceRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(e -> VoiceAssistantDTO.VoiceHistoryDto.builder()
                        .id(e.getId())
                        .languageCode(e.getLanguageCode())
                        .transcribedQuery(e.getTranscribedQuery())
                        .spokenResponse(e.getSpokenResponse())
                        .writtenAdvisory(e.getWrittenAdvisory())
                        .category(e.getCategory())
                        .isBookmarked(e.getIsBookmarked())
                        .createdAt(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteHistory(Long id, User currentUser) {
        voiceRepository.findById(id).ifPresent(entity -> {
            if (currentUser == null || (entity.getUser() != null && entity.getUser().getId().equals(currentUser.getId()))) {
                voiceRepository.delete(entity);
            }
        });
    }

    // --- Gemini Voice Integration ---

    private VoiceAssistantDTO.VoiceAdvisoryResponse callGeminiForVoice(String query, String langCode, String cropContext) throws Exception {
        String langName = getLanguageName(langCode);
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey
        );

        String systemInstruction = "You are 'Kisan Vani AI Krishi Mitra', a friendly, knowledgeable Indian agricultural scientist. "
                + "A farmer has spoken to you in " + langName + " (" + langCode + "). "
                + "Provide clear, practical, economical agronomic advice. "
                + "Respond strictly in JSON matching this schema: "
                + "{"
                + "\"spokenResponse\": \"short 2-3 sentence conversational spoken reply in " + langName + " script with natural tone\","
                + "\"writtenAdvisory\": \"detailed markdown guide in " + langName + " with step-by-step instructions\","
                + "\"actionItems\": [\"action 1 in " + langName + "\", \"action 2\", \"action 3\"],"
                + "\"suggestedNextQuestions\": [\"question 1 in " + langName + "\", \"question 2\"]"
                + "}";

        Map<String, Object> textPart = Map.of("text", "Farmer Question: " + query + (cropContext != null ? " (Crop: " + cropContext + ")" : ""));
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        Map<String, Object> systemPart = Map.of("text", systemInstruction);
        Map<String, Object> systemInstructionObj = Map.of("parts", List.of(systemPart));

        Map<String, Object> requestBody = Map.of(
                "systemInstruction", systemInstructionObj,
                "contents", List.of(content),
                "generationConfig", Map.of("responseMimeType", "application/json", "temperature", 0.3)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        JsonNode root = objectMapper.readTree(response.getBody());
        String jsonText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        JsonNode parsed = objectMapper.readTree(jsonText);

        List<String> actionItems = new ArrayList<>();
        if (parsed.has("actionItems") && parsed.get("actionItems").isArray()) {
            parsed.get("actionItems").forEach(n -> actionItems.add(n.asText()));
        }

        List<String> followUps = new ArrayList<>();
        if (parsed.has("suggestedNextQuestions") && parsed.get("suggestedNextQuestions").isArray()) {
            parsed.get("suggestedNextQuestions").forEach(n -> followUps.add(n.asText()));
        }

        return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                .transcribedQuery(query)
                .detectedLanguage(langName)
                .languageCode(langCode)
                .spokenResponse(parsed.path("spokenResponse").asText())
                .writtenAdvisory(parsed.path("writtenAdvisory").asText())
                .actionItems(actionItems)
                .suggestedNextQuestions(followUps)
                .category("AGRONOMY_VOICE")
                .createdAt(LocalDateTime.now())
                .build();
    }

    // --- Multi-Lingual Agronomic Knowledge Engine Fallback ---

    private VoiceAssistantDTO.VoiceAdvisoryResponse generateFallbackAdvisory(String query, String langCode) {
        String q = query.toLowerCase();
        String langName = getLanguageName(langCode);

        // 1. Stem Borer / Caterpillar / Pest query
        if (q.contains("borer") || q.contains("keeda") || q.contains("pest") || q.contains("hulu") || q.contains("puzhu") || q.contains("purugu") || q.contains("kida")) {
            return buildPestResponse(query, langCode, langName);
        }

        // 2. Yellow Leaves / Disease / Fungal
        if (q.contains("yellow") || q.contains("peela") || q.contains("haladi") || q.contains("manjal") || q.contains("pasupu") || q.contains("disease") || q.contains("roga") || q.contains("nooi")) {
            return buildDiseaseResponse(query, langCode, langName);
        }

        // 3. Fertilizer / NPK / Jeevamrutham
        if (q.contains("fertilizer") || q.contains("khad") || q.contains("gobbara") || q.contains("uram") || q.contains("eruvu") || q.contains("urea") || q.contains("jeevamrut")) {
            return buildFertilizerResponse(query, langCode, langName);
        }

        // 4. Default General Agronomy Response for that language
        return buildGeneralResponse(query, langCode, langName);
    }

    private VoiceAssistantDTO.VoiceAdvisoryResponse buildPestResponse(String query, String lang, String langName) {
        switch (lang) {
            case "kn":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Kannada")
                        .languageCode("kn")
                        .spokenResponse("ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ. ಕಾಂಡ ಕೊರೆಯುವ ಹುಳುವಿನ ನಿಯಂತ್ರಣಕ್ಕೆ ಎಕರೆಗೆ 5 ಲಿಂಗಾಕರ್ಷಕ ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ. ತೀವ್ರ ಬಾಧೆಯಿದ್ದಲ್ಲಿ ಕ್ಲೋರಾಂಟ್ರಾನಿಲಿಪ್ರೋಲ್ 0.3 ಮಿಲಿ ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.")
                        .writtenAdvisory("### 🌾 ಭತ್ತ ಮತ್ತು ತರಕಾರಿಗಳಲ್ಲಿ ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು ನಿಯಂತ್ರಣ\n- **ಜೈವಿಕ ಕ್ರಮ**: ಟ್ರೈಕೊಗ್ರಾಮ ಕಾರ್ಡ್‌ಗಳನ್ನು (Trichogramma Cards) 3 ಬಾರಿ ಬಿಡಿ.\n- **ರಾಸಾಯನಿಕ ಕ್ರಮ**: ಕೊರಾಜನ್ (Chlorantraniliprole 18.5% SC) 60 ಮಿಲಿ/ಎಕರೆಗೆ 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಸಿಂಪಡಿಸಿ.\n- **ಮುನ್ನೆಚ್ಚರಿಕೆ**: ಸಂಜೆ 4 ಗಂಟೆಯ ನಂತರ ಮಾತ್ರ ಸಿಂಪಡಣೆ ಮಾಡಿ.")
                        .actionItems(List.of("ಎಕರೆಗೆ 5 ಫೆರಮೋನ್ ಬಲೆ ಹಾಕಿ", "ಟ್ರೈಕೊಗ್ರಾಮ ಪರಾವಲಂಬಿ ಕಾರ್ಡ್ ಬಳಸಿ", "ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸಿ"))
                        .suggestedNextQuestions(List.of("ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಣೆ ಹೇಗೆ?", "ನೀರು ಎಷ್ಟು ದಿನ ನಿಲ್ಲಿಸಬೇಕು?"))
                        .category("PEST_CONTROL")
                        .createdAt(LocalDateTime.now())
                        .build();

            case "ta":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Tamil")
                        .languageCode("ta")
                        .spokenResponse("வணக்கம் விவசாயி நண்பரே. தண்டு துளைப்பான் புழுவை கட்டுப்படுத்த ஏக்கருக்கு 5 இனக்கவர்ச்சி பொறிகளை வையுங்கள். தீவிர பாதிப்பு இருந்தால் குளோரான்ட்ரனிலிப்ரோல் மருந்தை தெளிக்கவும்.")
                        .writtenAdvisory("### 🌾 தண்டு துளைப்பான் புழு மேலாண்மை வழிகாட்டுதல்\n- **இயற்கை முறை**: ஏக்கருக்கு 5 வேப்ப எண்ணெய் தெளிப்பு (10000 ppm) 30 மிலி/டேங்க்.\n- **மருந்து**: கோராசன் 60 மிலி 200 லிட்டர் நீரில் கலந்து தெளிக்கவும்.\n- **நீர் பாசனம்**: மருந்து அடிக்கும் முன் நிலத்தில் லேசான ஈரம் இருப்பதை உறுதி செய்யவும்.")
                        .actionItems(List.of("இனக்கவர்ச்சி பொறி 5 அமைக்கவும்", "வேப்ப எண்ணெய் 3% தெளிக்கவும்", "மாலையில் தெளிப்பு மேற்கொள்ளவும்"))
                        .suggestedNextQuestions(List.of("வேப்பங்கொட்டை கரைசல் எப்படி செய்வது?", "அடுத்த உரம் எப்போது வைக்க வேண்டும்?"))
                        .category("PEST_CONTROL")
                        .createdAt(LocalDateTime.now())
                        .build();

            case "te":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Telugu")
                        .languageCode("te")
                        .spokenResponse("నమస్కారం రైతు సోదరులారా. కాండం తొలుచు పురుగు నివారణకు ఎకరాకు 5 లింగాకర్షక బుట్టలు పెట్టండి. అవసరమైతే కొరాజెన్ మందును లీటరు నీటికి 0.3 మి.లీ కలిపి పిచికారీ చేయండి.")
                        .writtenAdvisory("### 🌾 కాండం తొలుచు పురుగు యాజమాన్యం\n- **లింగాకర్షక బుట్టలు**: ఎకరాకు 4-5 అమర్చాలి.\n- **రసాయన పిచికారీ**: క్లోరాంట్రానిలిప్రోల్ (కొరాజెన్) 60 మి.లీ 200 లీటర్ల నీటిలో ఎకరాకు పిచికారీ చేయాలి.")
                        .actionItems(List.of("ఎకరాకు 5 లింగాకర్షక బుట్టలు", "ట్రైకోగ్రామా కార్డుల వినియోగం", "సాయంత్రం వేళ పిచికారీ"))
                        .suggestedNextQuestions(List.of("వేప నూనె ఎంత కలపాలి?", "తదుపరి ఎరువుల మోతాదు ఎంత?"))
                        .category("PEST_CONTROL")
                        .createdAt(LocalDateTime.now())
                        .build();

            case "mr":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Marathi")
                        .languageCode("mr")
                        .spokenResponse("नमस्कार शेतकरी बंधूंनो. खोडकिडीच्या नियंत्रणासाठी एकरी ५ कामगंध सापळे लावा. प्रादुर्भाव जास्त असल्यास कोराजन ०.३ मिली प्रति लिटर पाण्यात मिसळून फवारा.")
                        .writtenAdvisory("### 🌾 खोडकीड नियंत्रण व व्यवस्थापन\n- **जैविक उपाय**: ट्रायकोकार्डचा वापर करा.\n- **रासायनिक फवारणी**: क्लोरांट्रानिलीप्रोल (कोराजन) ६० मिली प्रति २०० लिटर पाण्यात मिसळून फवारणी करा.")
                        .actionItems(List.of("एकरी ५ कामगंध सापळे लावा", "निंबोळी अर्क ५% फवारा", "संध्याकाळी फवारणी करा"))
                        .suggestedNextQuestions(List.of("दशपर्णी अर्क कसा बनवावा?", "खतांचे प्रमाण किती असावे?"))
                        .category("PEST_CONTROL")
                        .createdAt(LocalDateTime.now())
                        .build();

            case "en":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("English")
                        .languageCode("en")
                        .spokenResponse("Hello farmer. For stem borer and caterpillar management, install 5 pheromone traps per acre immediately. If infestation is severe, spray Chlorantraniliprole at 0.3 ml per liter of water.")
                        .writtenAdvisory("### 🌾 Stem Borer & Caterpillar Protocol\n- **Bio-Control**: Deploy Trichogramma egg parasitoid cards @ 20,000/acre.\n- **Chemical Intervention**: Chlorantraniliprole 18.5% SC (Coragen) @ 60 ml in 200L water per acre.\n- **Spray Timing**: Spray strictly during late afternoon (4 PM - 6 PM) to protect pollinator bees.")
                        .actionItems(List.of("Install 5 Pheromone Traps/acre", "Release Trichogramma cards", "Spray in late afternoon"))
                        .suggestedNextQuestions(List.of("How to prepare 5% Neem seed kernel extract?", "What is the next fertilizer dose?"))
                        .category("PEST_CONTROL")
                        .createdAt(LocalDateTime.now())
                        .build();

            default: // Hindi
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Hindi")
                        .languageCode("hi")
                        .spokenResponse("नमस्ते किसान भाई. तना छेदक और इल्ली कीट की रोकथाम के लिए प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं. यदि प्रकोप अधिक है, तो कोराजन 0.3 मिलीलीटर प्रति लीटर पानी में मिलाकर शाम के समय छिड़काव करें.")
                        .writtenAdvisory("### 🌾 तना छेदक एवं इल्ली कीट प्रबंधन सलाह\n- **जैविक नियंत्रण**: ट्राइकोग्रामा कार्ड्स (20,000 अंडे/एकड़) 3 बार 10 दिन के अंतराल पर लगाएं.\n- **रासायनिक उपाय**: क्लोरेंट्रानिलिप्रोल 18.5% SC (कोराजन) 60 मिली प्रति एकड़ 200 लीटर पानी में छिड़कें.\n- **सावधानी**: तेज धूप में छिड़काव न करें, शाम 4 बजे के बाद ही करें.")
                        .actionItems(List.of("प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं", "नीम तेल 10,000 PPM का छिड़काव", "शाम के समय ही दवा छिड़कें"))
                        .suggestedNextQuestions(List.of("नीम अर्क कैसे तैयार करें?", "खाद की अगली खुराक कब देनी है?"))
                        .category("PEST_CONTROL")
                        .createdAt(LocalDateTime.now())
                        .build();
        }
    }

    private VoiceAssistantDTO.VoiceAdvisoryResponse buildDiseaseResponse(String query, String lang, String langName) {
        switch (lang) {
            case "kn":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Kannada")
                        .languageCode("kn")
                        .spokenResponse("ಎಲೆಗಳು ಹಳದಿಯಾಗಲು ಕಬ್ಬಿಣದ ಕೊರತೆ ಅಥವಾ ಶಿಲೀಂಧ್ರ ಕಾರಣವಿರಬಹುದು. 19:19:19 ನೀರಿನಲ್ಲಿ ಕರಗುವ ಗೊಬ್ಬರ 5 ಗ್ರಾಂ ಮತ್ತು ಮ್ಯಾಂಕೋಜೆಬ್ 2 ಗ್ರಾಂ ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.")
                        .writtenAdvisory("### 🍃 ಎಲೆ ಹಳದಿಯಾಗುವಿಕೆ ನಿವಾರಣಾ ಕ್ರಮ\n- **ಪೋಷಕಾಂಶ**: ಫೆರಸ್ ಸಲ್ಫೇಟ್ 2 ಗ್ರಾಂ + ಸುಣ್ಣದ ತಿಳಿನೀರು ಸಿಂಪಡಿಸಿ.\n- **ಶಿಲೀಂಧ್ರ ರೋಗಕ್ಕೆ**: ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP 2.5 ಗ್ರಾಂ/ಲೀ ನೀರಿಗೆ ಬೆರೆಸಿ.")
                        .actionItems(List.of("19:19:19 ಗೊಬ್ಬರ 5 ಗ್ರಾಂ/ಲೀ ಸಿಂಪಡಿಸಿ", "ಮ್ಯಾಂಕೋಜೆಬ್ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಿ", "ಬೇರಿನ ಭಾಗದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಳ್ಳಿ"))
                        .suggestedNextQuestions(List.of("ಸುಣ್ಣದ ತಿಳಿನೀರು ತಯಾರಿಸುವುದು ಹೇಗೆ?", "ಹನಿ ನೀರಾವರಿಯಲ್ಲಿ ಎಷ್ಟು ಗೊಬ್ಬರ ಕೊಡಬೇಕು?"))
                        .category("DISEASE_DIAGNOSIS")
                        .createdAt(LocalDateTime.now())
                        .build();

            case "ta":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Tamil")
                        .languageCode("ta")
                        .spokenResponse("இலைகள் மஞ்சள் நிறமாக மாறுவதற்கு இரும்புச் சத்து குறைபாடு அல்லது பூஞ்சாண நோய் காரணமாக இருக்கலாம். 19:19:19 உரம் 5 கிராம் மற்றும் மான்கோசெப் 2 கிராம் ஒரு லிட்டர் நீரில் கலந்து தெளிக்கவும்.")
                        .writtenAdvisory("### 🍃 இலை மஞ்சள் நோய் தீர்வு\n- **நுண்ணூட்டம்**: அக்ரோமின் அல்லது ஃபெரஸ் சல்பேட் 2 கிராம்/லிட்டர் தெளிக்கவும்.\n- **பூஞ்சாணம்**: சாஃப் (கார்பன்டசிம் + மான்கோசெப்) 2 கிராம்/லிட்டர் தண்ணீரில் தெளிக்கவும்.")
                        .actionItems(List.of("19:19:19 உரம் தெளிக்கவும்", "மான்கோசெப் பூஞ்சாண மருந்து அடிக்கவும்", "வடிகால் வசதி செய்யவும்"))
                        .suggestedNextQuestions(List.of("நுண்ணூட்ட உரம் எப்போது போடலாம்?", "மஞ்சள் அட்டை பொறி வைக்கலாமா?"))
                        .category("DISEASE_DIAGNOSIS")
                        .createdAt(LocalDateTime.now())
                        .build();

            case "te":
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Telugu")
                        .languageCode("te")
                        .spokenResponse("ఆకులు పసుపు రంగులోకి మారడానికి ఇనుము లోపం లేదా శిలీంద్ర తెగులు కారణం కావచ్చు. 19:19:19 ఎరువు 5 గ్రాములు మరియు మాంకోజెబ్ 2 గ్రాములు లీటరు నీటికి కలిపి పిచికారీ చేయండి.")
                        .writtenAdvisory("### 🍃 ఆకులు పసుపు రంగు నివారణ\n- **పోషక లోపం**: 19:19:19 ఎరువు 5 గ్రా/లీ పిచికారీ చేయాలి.\n- **శిలీంద్ర నాశని**: సాఫ్ (కార్బెండజిమ్ + మాంకోజెబ్) 2 గ్రా/లీ నీటికి కలపాలి.")
                        .actionItems(List.of("19:19:19 ఎరువు పిచికారీ", "మాంకోజెబ్ శిలీంద్ర నాశని", "నీరు నిల్వ ఉండకుండా చూడటం"))
                        .suggestedNextQuestions(List.of("జింక్ లోపం ఎలా గుర్తించాలి?", "డ్రిప్ లో ఏ ఎరువు ఇవ్వాలి?"))
                        .category("DISEASE_DIAGNOSIS")
                        .createdAt(LocalDateTime.now())
                        .build();

            default: // Hindi & others
                return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                        .transcribedQuery(query)
                        .detectedLanguage("Hindi")
                        .languageCode("hi")
                        .spokenResponse("पत्तियों का पीला पड़ना नाइट्रोजन या सूक्ष्म पोषक तत्वों की कमी अथवा फफूंद रोग हो सकता है. प्रति लीटर पानी में 5 ग्राम 19:19:19 घुलनशील खाद और 2 ग्राम मैंकोजेब मिलाकर छिड़काव करें.")
                        .writtenAdvisory("### 🍃 पत्तियों का पीलापन दूर करने की सलाह\n- **पोषक तत्व स्प्रे**: 19:19:19 (NPK) 1 किग्रा प्रति एकड़ 200 लीटर पानी में छिड़कें.\n- **फफूंदनाशक**: साफ (SAAF - कार्बेन्डाजिम + मैंकोजेब) 2 ग्राम प्रति लीटर पानी में मिलाएं.\n- **मिट्टी की नमी**: जड़ों में जलभराव न होने दें.")
                        .actionItems(List.of("19:19:19 का पर्णीय छिड़काव करें", "साफ फफूंदनाशक 2 ग्राम/लीटर मिलाएं", "जल निकासी सुनिश्चित करें"))
                        .suggestedNextQuestions(List.of("जिंक सल्फेट की मात्रा कितनी रखें?", "क्या यूरिया टॉप ड्रेसिंग करें?"))
                        .category("DISEASE_DIAGNOSIS")
                        .createdAt(LocalDateTime.now())
                        .build();
        }
    }

    private VoiceAssistantDTO.VoiceAdvisoryResponse buildFertilizerResponse(String query, String lang, String langName) {
        return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                .transcribedQuery(query)
                .detectedLanguage(langName)
                .languageCode(lang)
                .spokenResponse(lang.equals("kn")
                        ? "ನೈಸರ್ಗಿಕ ಜೀವಾಮೃತಕ್ಕಾಗಿ 200 ಲೀಟರ್ ನೀರಿಗೆ 10 ಕೆಜಿ ದೇಸಿ ಹಸುವಿನ ಸಗಣಿ, 10 ಲೀಟರ್ ಗಂಜಲ, 2 ಕೆಜಿ ಬೆಲ್ಲ ಮತ್ತು 2 ಕೆಜಿ ದ್ವಿದಳ ಧಾನ್ಯದ ಹಿಟ್ಟು ಬೆರೆಸಿ 48 ಗಂಟೆ ನೆರಳಿನಲ್ಲಿ ಹುದುಗಿಸಿ ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ಹಾಯಿಸಿ."
                        : "प्राकृतिक जीवामृत बनाने के लिए 200 लीटर पानी में 10 किलो देसी गाय का गोबर, 10 लीटर गोमूत्र, 2 किलो गुड़ और 2 किलो बेसन मिलाकर 48 घंटे छांव में रखें. इसके बाद प्रति एकड़ ड्रिप अथवा सिंचाई के साथ दें.")
                .writtenAdvisory("### 🌿 जीवामृत / संतुलित पोषण प्रोटोकॉल\n- **सामग्री**: 10 किग्रा गोबर + 10 लीटर गोमूत्र + 2 किग्रा गुड़ + 2 किग्रा बेसन + मुट्ठी भर उपजाऊ मिट्टी.\n- **फर्मेंटेशन**: 48 से 72 घंटे तक घड़ी की सुई की दिशा में दिन में दो बार चलाएं.\n- **प्रयोग**: प्रति एकड़ 200 लीटर जीवामृत महीने में दो बार सिंचाई के साथ दें.")
                .actionItems(List.of("48 घंटे छांव में तैयार करें", "प्रति एकड़ 200 लीटर ड्रिप से दें", "रासायनिक खाद से 15 दिन का अंतर रखें"))
                .suggestedNextQuestions(List.of("दशपर्णी अर्क की विधि?", "नीम खली कब डालें?"))
                .category("FERTILIZER_MANAGEMENT")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private VoiceAssistantDTO.VoiceAdvisoryResponse buildGeneralResponse(String query, String lang, String langName) {
        return VoiceAssistantDTO.VoiceAdvisoryResponse.builder()
                .transcribedQuery(query)
                .detectedLanguage(langName)
                .languageCode(lang)
                .spokenResponse(lang.equals("kn")
                        ? "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೃಷಿ ಮಿತ್ರ ದಾಖಲಿಸಿದೆ. ಬೆಳೆ ಬೆಳವಣಿಗೆ, ಮಳೆ ಮುನ್ಸೂಚನೆ, ಮಂಡಿ ದರ ಅಥವಾ ಕೀಟನಾಶಕಗಳ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ನಿಖರ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು."
                        : "किसान वाणी ने आपका प्रश्न दर्ज किया है. आप अपनी फसल का नाम, कीट का प्रकार, मौसम अथवा मंडी भाव के बारे में सीधे बोलकर पूछ सकते हैं.")
                .writtenAdvisory("### 🌾 किसान वाणी कृषि मित्र सहायता\n- **मौसम सलाह**: अगले 3 दिन वर्षा की संभावना के अनुसार ही सिंचाई करें.\n- **मंडी भाव**: e-NAM पोर्टल पर लाइव भाव देखकर ही फसल की बिक्री का निर्णय लें.\n- **मृदा स्वास्थ्य**: रासायनिक उर्वरकों का प्रयोग सॉइल टेस्ट रिपोर्ट के अनुसार करें.")
                .actionItems(List.of("फसल की फोटो डायग्नोस्टिक लैब में अपलोड करें", "लाइव मंडी भाव चेक करें", "अगली सिंचाई का शेड्यूल देखें"))
                .suggestedNextQuestions(List.of("आज का मंडी भाव क्या है?", "फसल बीमा क्लेम कैसे करें?"))
                .category("GENERAL_ADVISORY")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String getLanguageName(String code) {
        switch (code.toLowerCase()) {
            case "hi": return "Hindi";
            case "kn": return "Kannada";
            case "ta": return "Tamil";
            case "te": return "Telugu";
            case "mr": return "Marathi";
            case "en": return "English";
            default: return "Hindi";
        }
    }

    private String getDefaultPromptForLanguage(String code) {
        switch (code.toLowerCase()) {
            case "kn": return "ನನ್ನ ಭತ್ತದ ಬೆಳೆಗೆ ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು ಬಾಧೆ ಇದೆ, ಏನು ಮಾಡಬೇಕು?";
            case "ta": return "தக்காளி இலையில் மஞ்சள் புள்ளி நோய் உள்ளது, என்ன மருந்து தெளிக்க வேண்டும்?";
            case "te": return "మిరప తోటలో ముడత తెగులు నివారణకు ఏ మందు వాడాలి?";
            case "mr": return "सोयाबीन पिकावर लष्करी अळीचा प्रादुर्भाव झाला आहे, उपाय काय?";
            case "en": return "What is the best bio-control for stem borer in paddy crop?";
            default: return "टमाटर की फसल में पत्तियां पीली हो रही हैं, क्या उपाय करें?";
        }
    }

    private List<VoiceAssistantDTO.VoicePresetDto> getRegionalPresets(String lang) {
        switch (lang) {
            case "kn":
                return List.of(
                        VoiceAssistantDTO.VoicePresetDto.builder().id("kn-1").languageCode("kn").category("PEST").icon("🐛").promptText("ಭತ್ತದ ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು ನಿಯಂತ್ರಣ ಹೇಗೆ?").englishMeaning("Paddy stem borer remedy").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("kn-2").languageCode("kn").category("FERTILIZER").icon("🌿").promptText("ಜೀವಾಮೃತ ತಯಾರಿಸುವ ವಿಧಾನ ತಿಳಿಸಿ").englishMeaning("How to make Jeevamrutham?").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("kn-3").languageCode("kn").category("DISEASE").icon("🍃").promptText("ಟೊಮೆಟೊ ಎಲೆ ಹಳದಿ ರೋಗಕ್ಕೆ ಯಾವ ಔಷಧಿ?").englishMeaning("Tomato leaf yellowing medicine").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("kn-4").languageCode("kn").category("WEATHER").icon("🌦️").promptText("ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?").englishMeaning("Will it rain today in Mandya?").build()
                );
            case "ta":
                return List.of(
                        VoiceAssistantDTO.VoicePresetDto.builder().id("ta-1").languageCode("ta").category("PEST").icon("🐛").promptText("நெல் தண்டு துளைப்பான் கட்டுப்படுத்துவது எப்படி?").englishMeaning("Paddy stem borer control").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("ta-2").languageCode("ta").category("FERTILIZER").icon("🌿").promptText("இயற்கை பஞ்சகாவ்யா தயாரிப்பது எப்படி?").englishMeaning("How to make Panchagavya?").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("ta-3").languageCode("ta").category("DISEASE").icon("🍃").promptText("மிளகாய் இலை சுருட்டல் நோய்க்கு தீர்வு என்ன?").englishMeaning("Chilli leaf curl remedy").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("ta-4").languageCode("ta").category("MANDI").icon("💰").promptText("இன்றைய தக்காளி மண்டி விலை என்ன?").englishMeaning("Today's tomato market rate").build()
                );
            case "te":
                return List.of(
                        VoiceAssistantDTO.VoicePresetDto.builder().id("te-1").languageCode("te").category("PEST").icon("🐛").promptText("వరిలో కాండం తొలుచు పురుగు నివారణ ఎలా?").englishMeaning("Paddy stem borer control").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("te-2").languageCode("te").category("DISEASE").icon("🍃").promptText("మిరపలో ఆకు ముడత తెగులు నివారణ మందు?").englishMeaning("Chilli leaf curl medicine").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("te-3").languageCode("te").category("FERTILIZER").icon("🌿").promptText("జీవామృతం తయారీ విధానం చెప్పండి").englishMeaning("How to prepare Jeevamrutham").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("te-4").languageCode("te").category("WEATHER").icon("🌦️").promptText("ఈ రోజు వర్ష సూచన ఉందా?").englishMeaning("Is there rain forecast today?").build()
                );
            case "mr":
                return List.of(
                        VoiceAssistantDTO.VoicePresetDto.builder().id("mr-1").languageCode("mr").category("PEST").icon("🐛").promptText("सोयाबीन पिकावरील लष्करी अळी नियंत्रण कसे करावे?").englishMeaning("Fall armyworm on soybean").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("mr-2").languageCode("mr").category("DISEASE").icon("🍃").promptText("कापूस पांढरी माशी नियंत्रण उपाय सांगा").englishMeaning("Cotton whitefly remedy").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("mr-3").languageCode("mr").category("FERTILIZER").icon("🌿").promptText("दशपर्णी अर्क बनवण्याची पद्धत काय?").englishMeaning("Dashparni Ark recipe").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("mr-4").languageCode("mr").category("MANDI").icon("💰").promptText("आजचा कांदा बाजार भाव काय आहे?").englishMeaning("Today's onion mandi price").build()
                );
            case "en":
                return List.of(
                        VoiceAssistantDTO.VoicePresetDto.builder().id("en-1").languageCode("en").category("PEST").icon("🐛").promptText("What is the bio-control for stem borer in paddy?").englishMeaning("Paddy stem borer bio-control").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("en-2").languageCode("en").category("FERTILIZER").icon("🌿").promptText("How to prepare organic Jeevamrutham fertilizer?").englishMeaning("Organic Jeevamrutham guide").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("en-3").languageCode("en").category("DISEASE").icon("🍃").promptText("Remedy for yellow leaf curl virus in tomatoes?").englishMeaning("Tomato yellow leaf curl remedy").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("en-4").languageCode("en").category("WEATHER").icon("🌦️").promptText("Is rain expected in the next 48 hours for spraying?").englishMeaning("Rain forecast for spraying").build()
                );
            default: // Hindi
                return List.of(
                        VoiceAssistantDTO.VoicePresetDto.builder().id("hi-1").languageCode("hi").category("PEST").icon("🐛").promptText("धान में तना छेदक कीट की रोकथाम कैसे करें?").englishMeaning("Paddy stem borer remedy").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("hi-2").languageCode("hi").category("DISEASE").icon("🍃").promptText("टमाटर में पत्ती पीली होने पर कौन सी दवा डालें?").englishMeaning("Tomato leaf yellowing medicine").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("hi-3").languageCode("hi").category("FERTILIZER").icon("🌿").promptText("प्राकृतिक जीवामृत खाद बनाने की विधि बताएं").englishMeaning("Jeevamrutham preparation guide").build(),
                        VoiceAssistantDTO.VoicePresetDto.builder().id("hi-4").languageCode("hi").category("WEATHER").icon("🌦️").promptText("क्या आज बारिश होगी या सिंचाई कर सकते हैं?").englishMeaning("Will it rain today or irrigate?").build()
                );
        }
    }
}
