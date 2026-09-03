package com.farmverse.backend.service;

import com.farmverse.backend.dto.CropRequest;
import com.farmverse.backend.entity.Crop;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.CropRepository;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CropService {

    private final CropRepository cropRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    public CropService(CropRepository cropRepository, FarmRepository farmRepository, UserRepository userRepository) {
        this.cropRepository = cropRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
    }

    // Add a crop cycle with strict date, acreage, and ownership checks
    public Crop addCrop(Long farmId, String userEmail, CropRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + farmId));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdmin = role.contains("ADMIN");

        // Verify farm ownership
        if (!isAdmin) {
            if (farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot add crops to a farm you do not own.");
            }
        }

        // Validate date sequence
        if (request.getExpectedHarvestDate().isBefore(request.getPlantingDate())) {
            throw new IllegalArgumentException("Expected harvest date (" + request.getExpectedHarvestDate() +
                    ") cannot be before planting date (" + request.getPlantingDate() + ").");
        }

        // Validate realistic acreage capacity against farm size
        if (farm.getTotalAreaAcres() != null && request.getArea() > farm.getTotalAreaAcres()) {
            throw new IllegalArgumentException("Crop area (" + request.getArea() +
                    " ha) cannot exceed total farm area (" + farm.getTotalAreaAcres() + " ha).");
        }

        Crop crop = new Crop();
        crop.setFarm(farm);
        crop.setCropName(request.getCropName().trim());
        crop.setVariety(request.getVariety().trim());
        crop.setPlantingDate(request.getPlantingDate());
        crop.setExpectedHarvestDate(request.getExpectedHarvestDate());
        crop.setStatus(request.getStatus() != null ? request.getStatus().trim() : "Growing");
        crop.setArea(request.getArea());
        crop.setCreatedAt(LocalDateTime.now());

        return cropRepository.save(crop);
    }

    // Role-aware Crop Retrieval (Agronomist & Admin see all; Farmer sees own)
    public List<Crop> getCropsByUserRole(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";

        if (role.contains("ADMIN") || role.contains("AGRONOMIST")) {
            return cropRepository.findAll();
        }

        return cropRepository.findAllByFarmerEmail(userEmail);
    }

    public List<Crop> getCropsByFarm(Long farmId) {
        return cropRepository.findByFarmId(farmId);
    }

    // Update crop with validation and ownership check
    public Crop updateCrop(Long cropId, String userEmail, CropRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found with id: " + cropId));

        Farm farm = crop.getFarm();
        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdmin = role.contains("ADMIN");

        if (!isAdmin) {
            if (farm == null || farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot edit crops for a farm you do not own.");
            }
        }

        // Validate date sequence if provided
        if (request.getPlantingDate() != null && request.getExpectedHarvestDate() != null) {
            if (request.getExpectedHarvestDate().isBefore(request.getPlantingDate())) {
                throw new IllegalArgumentException("Expected harvest date cannot be before planting date.");
            }
        }

        // Validate acreage if updated
        if (request.getArea() != null && farm != null && farm.getTotalAreaAcres() != null) {
            if (request.getArea() > farm.getTotalAreaAcres()) {
                throw new IllegalArgumentException("Crop area cannot exceed total farm area (" + farm.getTotalAreaAcres() + " ha).");
            }
            crop.setArea(request.getArea());
        }

        if (request.getCropName() != null && !request.getCropName().isBlank()) crop.setCropName(request.getCropName().trim());
        if (request.getVariety() != null && !request.getVariety().isBlank()) crop.setVariety(request.getVariety().trim());
        if (request.getPlantingDate() != null) crop.setPlantingDate(request.getPlantingDate());
        if (request.getExpectedHarvestDate() != null) crop.setExpectedHarvestDate(request.getExpectedHarvestDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) crop.setStatus(request.getStatus().trim());

        return cropRepository.save(crop);
    }

    // Delete crop with ownership check
    public void deleteCrop(Long cropId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found with id: " + cropId));

        Farm farm = crop.getFarm();
        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdmin = role.contains("ADMIN");

        if (!isAdmin) {
            if (farm == null || farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot delete crops for a farm you do not own.");
            }
        }

        cropRepository.delete(crop);
    }
}