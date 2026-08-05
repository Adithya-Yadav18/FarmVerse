package com.farmverse.backend.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Changed from java.security.Key to javax.crypto.SecretKey
import javax.crypto.SecretKey; 

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .signWith(getSignInKey()) 
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey()) // Now matches the SecretKey type
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // Changed return type to SecretKey
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}