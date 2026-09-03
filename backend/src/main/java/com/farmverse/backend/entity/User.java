package com.farmverse.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

// @Data is a Lombok annotation that automatically generates getters, setters, and constructors
@Data
// @Entity tells Spring Boot that this class represents a database table
@Entity
// @Table lets us customize the table name in MySQL
@Table(name = "users")
public class User {

    // @Id marks this as the Primary Key
    // @GeneratedValue makes it Auto-Increment in MySQL
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    @JsonIgnore
    private String password;
    private String role; // e.g., "ROLE_FARMER", "ROLE_AGRONOMIST", "ROLE_ADMIN", "ROLE_USER"
    private String phoneNumber;
    
    private LocalDateTime createdAt;
}