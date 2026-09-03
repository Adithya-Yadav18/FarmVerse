package com.farmverse.backend.service;

import com.farmverse.backend.dto.SoilRequest;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.SoilData;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.SoilDataRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SoilService {

    private final SoilDataRepository soilDataRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;

    public SoilService(SoilDataRepository soilDataRepository,
                       FarmRepository farmRepository,
                       UserRepository userRepository,
                       GeminiService geminiService) {
        this.soilDataRepository = soilDataRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.geminiService = geminiService;
    }

    public SoilData addSoilData(SoilRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + request.getFarmId()));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdminOrAgronomist = role.contains("ADMIN") || role.contains("AGRONOMIST");

        if (!isAdminOrAgronomist) {
            if (farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot submit soil tests for a farm you do not own.");
            }
        }

        SoilData soil = new SoilData();
        soil.setFarm(farm);
        soil.setPhLevel(request.getPhLevel());
        soil.setMoisture(request.getMoisture());
        soil.setNitrogen(request.getNitrogen());
        soil.setPhosphorus(request.getPhosphorus());
        soil.setPotassium(request.getPotassium());
        soil.setOrganicCarbon(request.getOrganicCarbon());
        soil.setRecordedAt(LocalDateTime.now());

        // Generate AI / LLM recommendation based on soil metrics with local fallback
        String recommendation = geminiService.generateSoilRecommendation(soil, farm.getFarmName());
        soil.setRecommendation(recommendation);

        return soilDataRepository.save(soil);
    }

    public List<SoilData> getSoilDataByUserRole(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        if (role.contains("ADMIN") || role.contains("AGRONOMIST")) {
            return soilDataRepository.findAll();
        }

        return soilDataRepository.findAllByFarmerEmail(userEmail);
    }

    public void deleteSoilData(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        SoilData soil = soilDataRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Soil data not found with id: " + id));

        Farm farm = soil.getFarm();
        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdmin = role.contains("ADMIN");

        if (!isAdmin) {
            if (farm == null || farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot delete soil records for a farm you do not own.");
            }
        }

        soilDataRepository.delete(soil);
    }
}