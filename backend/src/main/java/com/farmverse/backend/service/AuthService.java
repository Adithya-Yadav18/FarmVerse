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

    public AuthService(UserRepository userRepository,
                       FarmerRepository farmerRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse registerFarmer(RegisterRequest request) {
        // Validate password confirmation
        if (request.getConfirmPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email is already registered. Please login or use a different email address.");
        }

        // Determine Spring Security role
        String inputRole = request.getRole() != null ? request.getRole().trim().toUpperCase() : "FARMER";
        String securityRole;
        if (inputRole.contains("ADMIN")) {
            securityRole = "ROLE_ADMIN";
        } else if (inputRole.contains("AGRONOMIST")) {
            securityRole = "ROLE_AGRONOMIST";
        } else if (inputRole.contains("NORMAL") || inputRole.equals("USER")) {
            securityRole = "ROLE_NORMAL_USER";
        } else {
            securityRole = "ROLE_FARMER";
        }

        User user = new User();
        user.setFullName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(securityRole);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // If registered role is Farmer, create matching Farmer domain profile
        Farmer savedFarmer = null;
        if ("ROLE_FARMER".equals(securityRole)) {
            Farmer farmer = new Farmer();
            farmer.setUser(savedUser);
            farmer.setFullName(request.getName().trim());
            farmer.setPhoneNumber(request.getPhoneNumber());
            farmer.setRegion(request.getRegion());
            farmer.setFarmingExperienceYears(request.getFarmingExperienceYears() != null ? request.getFarmingExperienceYears() : 0);
            farmer.setPreferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "English");
            farmer.setCreatedAt(LocalDateTime.now());
            savedFarmer = farmerRepository.save(farmer);
        }

        // Generate JWT token
        String jwtToken = jwtService.generateToken(savedUser.getEmail());

        AuthResponse response = new AuthResponse();
        response.getTokens().setAccessToken(jwtToken);
        populateUserResponse(response.getUser(), savedUser, savedFarmer);

        return response;
    }

    public AuthResponse loginFarmer(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Perform authentication
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword());

        Authentication authentication = authenticationManager.authenticate(authToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Fetch User
        User loggedInUser = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        // Lookup Farmer profile conditionally (never crash on non-farmer roles)
        Farmer loggedInFarmer = farmerRepository.findByUser(loggedInUser).orElse(null);

        String jwtToken = jwtService.generateToken(loggedInUser.getEmail());

        AuthResponse response = new AuthResponse();
        response.getTokens().setAccessToken(jwtToken);
        populateUserResponse(response.getUser(), loggedInUser, loggedInFarmer);

        return response;
    }

    public AuthResponse.UserResponse getProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));
        Farmer farmer = farmerRepository.findByUser(user).orElse(null);

        AuthResponse.UserResponse userResp = new AuthResponse.UserResponse();
        populateUserResponse(userResp, user, farmer);
        return userResp;
    }

    public AuthResponse.UserResponse updateProfile(String userEmail, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));
        Farmer farmer = farmerRepository.findByUser(user).orElse(null);

        // Update User table
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setFullName(request.getName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhoneNumber(request.getPhone().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new IllegalArgumentException("Error: This email address is already in use by another account!");
                }
                user.setEmail(newEmail);
            }
        }
        userRepository.save(user);

        // If Farmer profile exists, update it as well
        if (farmer != null) {
            if (request.getName() != null) farmer.setFullName(request.getName().trim());
            if (request.getPhone() != null) farmer.setPhoneNumber(request.getPhone().trim());
            if (request.getLocation() != null) farmer.setRegion(request.getLocation().trim());
            farmerRepository.save(farmer);
        }

        AuthResponse.UserResponse userResp = new AuthResponse.UserResponse();
        populateUserResponse(userResp, user, farmer);
        return userResp;
    }

    private void populateUserResponse(AuthResponse.UserResponse response, User user, Farmer farmer) {
        response.setId(user.getId());
        String displayName = (farmer != null && farmer.getFullName() != null && !farmer.getFullName().isBlank())
                ? farmer.getFullName()
                : (user.getFullName() != null ? user.getFullName() : "User");
        response.setName(displayName);
        response.setEmail(user.getEmail());

        // Normalize role for frontend consumption (Farmer, Agronomist, Admin, Normal User)
        String rawRole = user.getRole();
        if (rawRole != null) {
            String clean = rawRole.replace("ROLE_", "").toUpperCase();
            if (clean.contains("ADMIN")) {
                response.setRole("Admin");
            } else if (clean.contains("AGRONOMIST")) {
                response.setRole("Agronomist");
            } else if (clean.contains("NORMAL") || clean.equals("USER")) {
                response.setRole("Normal User");
            } else {
                response.setRole("Farmer");
            }
        } else {
            response.setRole("Farmer");
        }

        if (farmer != null) {
            response.setPhoneNumber(farmer.getPhoneNumber() != null ? farmer.getPhoneNumber() : user.getPhoneNumber());
            response.setRegion(farmer.getRegion());
            response.setFarmingExperienceYears(farmer.getFarmingExperienceYears());
            response.setPreferredLanguage(farmer.getPreferredLanguage());
        } else {
            response.setPhoneNumber(user.getPhoneNumber());
            response.setRegion(null);
            response.setFarmingExperienceYears(0);
            response.setPreferredLanguage("English");
        }
    }
}