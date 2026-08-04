package com.farmverse.backend.service;

import com.farmverse.backend.dto.RegisterRequest;
import com.farmverse.backend.entity.Farmer;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.FarmerRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service // Tells Spring Boot this is a service class
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructor Injection (Senior engineers use this instead of @Autowired)
    public AuthService(UserRepository userRepository, FarmerRepository farmerRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String registerFarmer(RegisterRequest request) {
        // 1. Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // 2. Create the User (Login credentials)
        User user = new User();
        user.setEmail(request.getEmail());
        // Hashing the password! Never save plain text passwords.
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_FARMER");
        user.setCreatedAt(LocalDateTime.now());
        
        // Save the User to the database
        User savedUser = userRepository.save(user);

        // 3. Create the Farmer (Profile data)
        Farmer farmer = new Farmer();
        farmer.setUser(savedUser);
        farmer.setFullName(request.getFullName());
        farmer.setPhoneNumber(request.getPhoneNumber());
        farmer.setRegion(request.getRegion());
        farmer.setFarmingExperienceYears(request.getFarmingExperienceYears());
        farmer.setPreferredLanguage(request.getPreferredLanguage());
        farmer.setCreatedAt(LocalDateTime.now());

        // Save the Farmer to the database
        farmerRepository.save(farmer);

        return "Farmer registered successfully!";
    }
}