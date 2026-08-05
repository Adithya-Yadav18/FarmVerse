package com.farmverse.backend.service;

import com.farmverse.backend.dto.LoginRequest;
import com.farmverse.backend.dto.RegisterRequest;
import com.farmverse.backend.entity.Farmer;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.FarmerRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService; // NEW: Added JwtService

    // Updated Constructor
    public AuthService(UserRepository userRepository, FarmerRepository farmerRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public String registerFarmer(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_FARMER");
        user.setCreatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);

        Farmer farmer = new Farmer();
        farmer.setUser(savedUser);
        farmer.setFullName(request.getFullName());
        farmer.setPhoneNumber(request.getPhoneNumber());
        farmer.setRegion(request.getRegion());
        farmer.setFarmingExperienceYears(request.getFarmingExperienceYears());
        farmer.setPreferredLanguage(request.getPreferredLanguage());
        farmer.setCreatedAt(LocalDateTime.now());

        farmerRepository.save(farmer);

        return "Farmer registered successfully!";
    }

    public String loginFarmer(LoginRequest request) {
        try {
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());
            
            Authentication authentication = authenticationManager.authenticate(authToken);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // NEW: Generate the JWT token using our JwtService
            String jwtToken = jwtService.generateToken(request.getEmail());
            
            // Return the token instead of a success message
            return jwtToken;
            
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }
    }
}