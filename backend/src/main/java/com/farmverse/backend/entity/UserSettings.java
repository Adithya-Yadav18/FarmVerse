package com.farmverse.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private boolean emailNotifications = true;

    @Builder.Default
    private boolean pushNotifications = true;

    @Builder.Default
    private boolean smsNotifications = false;

    @Builder.Default
    private boolean alertNotifications = true;

    @Builder.Default
    private boolean reportNotifications = false;

    @Builder.Default
    private boolean weatherNotifications = true;

    @Builder.Default
    private boolean twoFactorAuth = false;

    @Builder.Default
    private boolean activityLog = true;

    @Builder.Default
    private String themePreference = "system";

    @Builder.Default
    private String languagePreference = "en";

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
