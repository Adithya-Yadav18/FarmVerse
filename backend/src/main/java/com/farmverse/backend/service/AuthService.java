package com.farmverse.backend.service;

import com.farmverse.backend.dto.AuthResponse;
import com.farmverse.backend.dto.LoginRequest;
import com.farmverse.backend.dto.ProfileUpdateRequest;
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
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, FarmerRepository farmerRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse registerFarmer(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // Use the role from frontend, or default to FARMER
        if (request.getRole() != null) {
            user.setRole("ROLE_" + request.getRole().toUpperCase());
        } else {
            user.setRole("ROLE_FARMER");
        }
        user.setCreatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);

        Farmer farmer = new Farmer();
        farmer.setUser(savedUser);
        farmer.setFullName(request.getName());
        farmer.setPhoneNumber(request.getPhoneNumber());
        farmer.setRegion(request.getRegion());
        farmer.setFarmingExperienceYears(request.getFarmingExperienceYears());
        farmer.setPreferredLanguage(request.getPreferredLanguage());
        farmer.setCreatedAt(LocalDateTime.now());

        Farmer savedFarmer = farmerRepository.save(farmer);

        // Generate a token for the newly registered user
        String jwtToken = jwtService.generateToken(savedUser.getEmail());
        
        AuthResponse response = new AuthResponse();
        response.getTokens().setAccessToken(jwtToken);

        // UPDATED: Use the helper method to send ALL fields!
        populateUserResponse(response.getUser(), savedUser, savedFarmer);

        return response;
    }

    public AuthResponse loginFarmer(LoginRequest request) {
        try {
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());
            
            Authentication authentication = authenticationManager.authenticate(authToken);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Fetch the user from the database
            User loggedInUser = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Fetch the Farmer profile to get the real name!
            Farmer loggedInFarmer = farmerRepository.findByUser(loggedInUser)
                    .orElseThrow(() -> new RuntimeException("Farmer profile not found"));
            
            String jwtToken = jwtService.generateToken(loggedInUser.getEmail());
            
            AuthResponse response = new AuthResponse();
            response.getTokens().setAccessToken(jwtToken);

            // UPDATED: Use the helper method to send ALL fields!
            populateUserResponse(response.getUser(), loggedInUser, loggedInFarmer);
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }
    }

    // Method to get the user's profile
    public AuthResponse.UserResponse getProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Farmer farmer = farmerRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        AuthResponse.UserResponse userResp = new AuthResponse.UserResponse();
        populateUserResponse(userResp, user, farmer);
        return userResp;
    }

    // Method to update the user's profile
    public AuthResponse.UserResponse updateProfile(String userEmail, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Farmer farmer = farmerRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        // Update Farmer details
        if (request.getName() != null) farmer.setFullName(request.getName());
        if (request.getPhone() != null) farmer.setPhoneNumber(request.getPhone());
        if (request.getLocation() != null) farmer.setRegion(request.getLocation());
        farmerRepository.save(farmer);

        // Update User email safely
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            // 1. Check if the new email is already taken by someone else
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Error: This email is already in use by another account!");
            }
            // 2. Update the email
            user.setEmail(request.getEmail());
            userRepository.save(user);
        }

        AuthResponse.UserResponse userResp = new AuthResponse.UserResponse();
        populateUserResponse(userResp, user, farmer);
        return userResp;
    }
    
    // 🧠 Senior Engineer Tip: Helper method to avoid repeating the same mapping code!
    private void populateUserResponse(AuthResponse.UserResponse response, User user, Farmer farmer) {
        response.setId(user.getId());
        response.setName(farmer.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setPhoneNumber(farmer.getPhoneNumber());
        response.setRegion(farmer.getRegion());
        response.setFarmingExperienceYears(farmer.getFarmingExperienceYears());
        response.setPreferredLanguage(farmer.getPreferredLanguage());
    }
}