package com.farmverse.backend.service;

import com.farmverse.backend.dto.AuthResponse;
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
}