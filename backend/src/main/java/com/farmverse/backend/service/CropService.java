package com.farmverse.backend.service;

import com.farmverse.backend.dto.CropRequest;
import com.farmverse.backend.entity.Crop;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.repository.CropRepository;
import com.farmverse.backend.repository.FarmRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CropService {

    private final CropRepository cropRepository;
    private final FarmRepository farmRepository;

    public CropService(CropRepository cropRepository, FarmRepository farmRepository) {
        this.cropRepository = cropRepository;
        this.farmRepository = farmRepository;
    }

    public Crop addCrop(Long farmId, CropRequest request) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

        Crop crop = new Crop();
        crop.setFarm(farm);
        crop.setCropName(request.getCropName());
        crop.setVariety(request.getVariety());
        crop.setPlantingDate(request.getPlantingDate());
        crop.setExpectedHarvestDate(request.getExpectedHarvestDate()); // New
        crop.setStatus(request.getStatus() != null ? request.getStatus() : "Growing");
        crop.setArea(request.getArea()); // New
        crop.setCreatedAt(LocalDateTime.now());

        return cropRepository.save(crop);
    }

    public List<Crop> getCropsByFarm(Long farmId) {
        return cropRepository.findByFarmId(farmId);
    }

    // NEW: Get all crops for the logged-in user
    public List<Crop> getAllCropsForUser(String email) {
        return cropRepository.findAllByFarmerEmail(email);
    }

    // NEW: Update crop
    public Crop updateCrop(Long cropId, CropRequest request) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new RuntimeException("Crop not found with id: " + cropId));

        if (request.getCropName() != null) crop.setCropName(request.getCropName());
        if (request.getVariety() != null) crop.setVariety(request.getVariety());
        if (request.getPlantingDate() != null) crop.setPlantingDate(request.getPlantingDate());
        if (request.getExpectedHarvestDate() != null) crop.setExpectedHarvestDate(request.getExpectedHarvestDate());
        if (request.getStatus() != null) crop.setStatus(request.getStatus());
        if (request.getArea() != null) crop.setArea(request.getArea());

        return cropRepository.save(crop);
    }

    // NEW: Delete crop
    public void deleteCrop(Long cropId) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new RuntimeException("Crop not found with id: " + cropId));
        cropRepository.delete(crop);
    }
}