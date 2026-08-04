package com.farmverse.backend.repository;

import com.farmverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// JpaRepository gives us all basic CRUD methods (save, findById, delete) for free!
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Spring Data JPA is smart. Just by naming this method findByEmail,
    // it will automatically generate the SQL query: "SELECT * FROM users WHERE email = ?"
    Optional<User> findByEmail(String email);
}