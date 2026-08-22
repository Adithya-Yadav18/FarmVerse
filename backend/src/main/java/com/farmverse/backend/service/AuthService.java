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

        // Populate the user details so the frontend doesn't crash!
        response.getUser().setId(savedUser.getId());
        response.getUser().setName(savedFarmer.getFullName());
        response.getUser().setEmail(savedUser.getEmail());
        response.getUser().setRole(savedUser.getRole());

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

            // Set the actual name, not the email!
            response.getUser().setId(loggedInUser.getId());
            response.getUser().setName(loggedInFarmer.getFullName());
            response.getUser().setEmail(loggedInUser.getEmail());
            response.getUser().setRole(loggedInUser.getRole());
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }
    }

        // Method to get the user's profile
    public AuthResponse getProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Farmer farmer = farmerRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        AuthResponse response = new AuthResponse();
        // We don't need to generate new tokens just to view the profile, 
        // but we can leave them empty or null since the frontend only reads the "user" object here.
        populateUserResponse(response, user, farmer);
        return response;
    }

    // Method to update the user's profile
    public AuthResponse updateProfile(String userEmail, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Farmer farmer = farmerRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        // Update only the provided fields
        if (request.getFullName() != null) farmer.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) farmer.setPhoneNumber(request.getPhoneNumber());
        if (request.getRegion() != null) farmer.setRegion(request.getRegion());
        if (request.getFarmingExperienceYears() != null) farmer.setFarmingExperienceYears(request.getFarmingExperienceYears());
        if (request.getPreferredLanguage() != null) farmer.setPreferredLanguage(request.getPreferredLanguage());

        farmerRepository.save(farmer);

        AuthResponse response = new AuthResponse();
        populateUserResponse(response, user, farmer);
        return response;
    }

    // 🧠 Senior Engineer Tip: Helper method to avoid repeating the same mapping code!
    private void populateUserResponse(AuthResponse response, User user, Farmer farmer) {
        response.getUser().setId(user.getId());
        response.getUser().setName(farmer.getFullName());
        response.getUser().setEmail(user.getEmail());
        response.getUser().setRole(user.getRole());
        response.getUser().setPhoneNumber(farmer.getPhoneNumber());
        response.getUser().setRegion(farmer.getRegion());
        response.getUser().setFarmingExperienceYears(farmer.getFarmingExperienceYears());
        response.getUser().setPreferredLanguage(farmer.getPreferredLanguage());
    }
}