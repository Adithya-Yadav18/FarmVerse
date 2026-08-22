package com.farmverse.backend.service;

import com.farmverse.backend.dto.FarmRequest;
import com.farmverse.backend.entity.Farm;
import com.farmverse.backend.entity.Farmer;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.FarmRepository;
import com.farmverse.backend.repository.FarmerRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
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

    // Method to add a farm
    public Farm addFarm(String userEmail, FarmRequest request) {
        // 1. Find the User by email (we will pass the email from the JWT in the controller)
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 2. Find the Farmer profile linked to this User
        Farmer farmer = farmerRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        // 3. Create the new Farm and link it to the Farmer
        Farm farm = new Farm();
        farm.setFarmer(farmer);
        farm.setFarmName(request.getFarmName());
        farm.setLocation(request.getLocation());
        farm.setTotalAreaAcres(request.getTotalAreaAcres());
        farm.setSoilType(request.getSoilType());
        farm.setCreatedAt(LocalDateTime.now());

        // 4. Save to database
        return farmRepository.save(farm);
    }

    // Method to get all farms for a specific farmer
    public List<Farm> getFarmsByFarmer(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Farmer farmer = farmerRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        return farmRepository.findByFarmerId(farmer.getId());
    }

        // Method to update a farm
    public Farm updateFarm(Long farmId, FarmRequest request) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

        // Update only the provided fields
        if (request.getFarmName() != null) farm.setFarmName(request.getFarmName());
        if (request.getLocation() != null) farm.setLocation(request.getLocation());
        if (request.getTotalAreaAcres() != null) farm.setTotalAreaAcres(request.getTotalAreaAcres());
        if (request.getSoilType() != null) farm.setSoilType(request.getSoilType());

        return farmRepository.save(farm);
    }

    // Method to delete a farm
    public void deleteFarm(Long farmId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));
        farmRepository.delete(farm);
    }
}