package com.farmverse.backend.repository;

import com.farmverse.backend.entity.Farmer;
import com.farmverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    
    // Spring Data JPA will automatically generate the query to find a Farmer by their associated User
    Optional<Farmer> findByUser(User user);
}