package com.farmverse.backend.service;

import com.farmverse.backend.dto.FarmRequest;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.Farmer;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.FarmerRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class FarmService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;

    public FarmService(FarmRepository farmRepository, UserRepository userRepository, FarmerRepository farmerRepository) {
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
    }

    // Add a farm (Restricted to Farmer and Admin)
    public Farm addFarm(String userEmail, FarmRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        // Resolve or create farmer profile for this user
        Farmer farmer = farmerRepository.findByUser(user).orElseGet(() -> {
            Farmer newFarmer = new Farmer();
            newFarmer.setUser(user);
            newFarmer.setFullName(user.getFullName() != null ? user.getFullName() : "Farmer");
            newFarmer.setPhoneNumber(user.getPhoneNumber());
            newFarmer.setRegion(request.getLocation());
            newFarmer.setFarmingExperienceYears(0);
            newFarmer.setPreferredLanguage("English");
            newFarmer.setCreatedAt(LocalDateTime.now());
            return farmerRepository.save(newFarmer);
        });

        Farm farm = new Farm();
        farm.setFarmer(farmer);
        farm.setFarmName(request.getName().trim());
        farm.setLocation(request.getLocation().trim());
        farm.setTotalAreaAcres(request.getArea());
        farm.setSoilType(request.getSoilType().trim());
        farm.setStatus(request.getStatus() != null ? request.getStatus() : "Active");
        farm.setCreatedAt(LocalDateTime.now());

        return farmRepository.save(farm);
    }

    // Role-aware Farm Retrieval (Admin & Agronomist see all; Farmer sees own)
    public List<Farm> getFarmsByUserRole(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";

        // Admin & Agronomist have global visibility across all registered farms
        if (role.contains("ADMIN") || role.contains("AGRONOMIST")) {
            return farmRepository.findAll();
        }

        // Farmer only sees farms they own
        Farmer farmer = farmerRepository.findByUser(user).orElse(null);
        if (farmer == null) {
            return Collections.emptyList();
        }
        return farmRepository.findByFarmerId(farmer.getId());
    }

    // Get single farm with role protection
    public Farm getFarmById(Long farmId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + farmId));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        if (role.contains("ADMIN") || role.contains("AGRONOMIST")) {
            return farm;
        }

        // Verify ownership for Farmer
        if (farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                !farm.getFarmer().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view this farm.");
        }

        return farm;
    }

    // Update farm (Only owner Farmer or Admin)
    public Farm updateFarm(Long farmId, String userEmail, FarmRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + farmId));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdmin = role.contains("ADMIN");

        if (!isAdmin) {
            if (farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot edit a farm you do not own.");
            }
        }

        if (request.getName() != null && !request.getName().isBlank()) farm.setFarmName(request.getName().trim());
        if (request.getLocation() != null && !request.getLocation().isBlank()) farm.setLocation(request.getLocation().trim());
        if (request.getArea() != null && request.getArea() > 0) farm.setTotalAreaAcres(request.getArea());
        if (request.getSoilType() != null && !request.getSoilType().isBlank()) farm.setSoilType(request.getSoilType().trim());
        if (request.getStatus() != null && !request.getStatus().isBlank()) farm.setStatus(request.getStatus().trim());

        return farmRepository.save(farm);
    }

    // Delete farm (Only owner Farmer or Admin)
    public void deleteFarm(Long farmId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found: " + userEmail));

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found with id: " + farmId));

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";
        boolean isAdmin = role.contains("ADMIN");

        if (!isAdmin) {
            if (farm.getFarmer() == null || farm.getFarmer().getUser() == null ||
                    !farm.getFarmer().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You cannot delete a farm you do not own.");
            }
        }

        farmRepository.delete(farm);
    }
}