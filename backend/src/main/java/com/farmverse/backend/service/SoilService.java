package com.farmverse.backend.service;

import com.farmverse.backend.dto.SoilRequest;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.SoilData;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.SoilDataRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SoilService {

    private final SoilDataRepository soilDataRepository;
    private final FarmRepository farmRepository;
    private final GeminiService geminiService;

    public SoilService(SoilDataRepository soilDataRepository, FarmRepository farmRepository, GeminiService geminiService) {
        this.soilDataRepository = soilDataRepository;
        this.farmRepository = farmRepository;
        this.geminiService = geminiService;
    }

    public SoilData addSoilData(SoilRequest request) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + request.getFarmId()));

        SoilData soil = new SoilData();
        soil.setFarm(farm);
        soil.setPhLevel(request.getPhLevel());
        soil.setMoisture(request.getMoisture());
        soil.setNitrogen(request.getNitrogen());
        soil.setPhosphorus(request.getPhosphorus());
        soil.setPotassium(request.getPotassium());
        soil.setOrganicCarbon(request.getOrganicCarbon());
        soil.setRecordedAt(LocalDateTime.now());

        // Generate AI / LLM recommendation based on soil metrics
        String recommendation = geminiService.generateSoilRecommendation(soil, farm.getFarmName());
        soil.setRecommendation(recommendation);

        return soilDataRepository.save(soil);
    }

    public List<SoilData> getSoilDataForUser(String email) {
        return soilDataRepository.findAllByFarmerEmail(email);
    }

    public void deleteSoilData(Long id) {
        SoilData soil = soilDataRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soil data not found with id: " + id));
        soilDataRepository.delete(soil);
    }
}