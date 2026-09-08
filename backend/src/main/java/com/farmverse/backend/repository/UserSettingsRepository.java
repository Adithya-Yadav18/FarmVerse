package com.farmverse.backend.repository;

import com.farmverse.backend.entity.User;
import com.farmverse.backend.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
    Optional<UserSettings> findByUser(User user);
    Optional<UserSettings> findByUserEmail(String email);
    Optional<UserSettings> findByUserId(Long userId);
}
