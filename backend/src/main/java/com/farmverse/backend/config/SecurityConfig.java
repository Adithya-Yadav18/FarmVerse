package com.farmverse.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration // Tells Spring this is a configuration class
@EnableWebSecurity // Turns on Spring Security
public class SecurityConfig {

    // 1. Tell Spring to use BCrypt for password hashing
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Configure which URLs are public and which are protected
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for REST APIs (we will use JWT later)
            .authorizeHttpRequests(auth -> auth
                // Anyone can access the /api/auth/** endpoints (register/login) without logging in
                .requestMatchers("/api/auth/**").permitAll() 
                // Every other endpoint requires authentication
                .anyRequest().authenticated() 
            );
        
        return http.build();
    }
}