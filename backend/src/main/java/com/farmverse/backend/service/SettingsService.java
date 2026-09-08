package com.farmverse.backend.service;

import com.farmverse.backend.dto.UserSettingsDTO;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.entity.UserSettings;
import com.farmverse.backend.repository.UserRepository;
import com.farmverse.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

    private final UserSettingsRepository settingsRepository;
    private final UserRepository userRepository;

    @Transactional
    public UserSettingsDTO.SettingsResponse getSettings(String userEmail) {
        User user = resolveUser(userEmail);
        UserSettings settings = settingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));
        return toDto(settings);
    }

    @Transactional
    public UserSettingsDTO.SettingsResponse updateSettings(String userEmail, UserSettingsDTO.UpdateSettingsRequest req) {
        User user = resolveUser(userEmail);
        UserSettings settings = settingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));

        if (req.getEmailNotifications() != null) settings.setEmailNotifications(req.getEmailNotifications());
        if (req.getPushNotifications() != null) settings.setPushNotifications(req.getPushNotifications());
        if (req.getSmsNotifications() != null) settings.setSmsNotifications(req.getSmsNotifications());
        if (req.getAlertNotifications() != null) settings.setAlertNotifications(req.getAlertNotifications());
        if (req.getReportNotifications() != null) settings.setReportNotifications(req.getReportNotifications());
        if (req.getWeatherNotifications() != null) settings.setWeatherNotifications(req.getWeatherNotifications());
        if (req.getTwoFactorAuth() != null) settings.setTwoFactorAuth(req.getTwoFactorAuth());
        if (req.getActivityLog() != null) settings.setActivityLog(req.getActivityLog());
        if (req.getThemePreference() != null) settings.setThemePreference(req.getThemePreference());
        if (req.getLanguagePreference() != null) settings.setLanguagePreference(req.getLanguagePreference());

        UserSettings saved = settingsRepository.save(settings);
        log.info("Updated settings for user: {}", user.getEmail());
        return toDto(saved);
    }

    private User resolveUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank() || "anonymousUser".equalsIgnoreCase(userEmail)) {
            return userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("No users registered in system"));
        }
        return userRepository.findByEmail(userEmail)
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail)));
    }

    private UserSettings createDefaultSettings(User user) {
        UserSettings defaults = UserSettings.builder()
                .user(user)
                .emailNotifications(true)
                .pushNotifications(true)
                .smsNotifications(false)
                .alertNotifications(true)
                .reportNotifications(false)
                .weatherNotifications(true)
                .twoFactorAuth(false)
                .activityLog(true)
                .themePreference("system")
                .languagePreference("en")
                .build();
        return settingsRepository.save(defaults);
    }

    private UserSettingsDTO.SettingsResponse toDto(UserSettings s) {
        return UserSettingsDTO.SettingsResponse.builder()
                .id(s.getId())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .userEmail(s.getUser() != null ? s.getUser().getEmail() : null)
                .emailNotifications(s.isEmailNotifications())
                .pushNotifications(s.isPushNotifications())
                .smsNotifications(s.isSmsNotifications())
                .alertNotifications(s.isAlertNotifications())
                .reportNotifications(s.isReportNotifications())
                .weatherNotifications(s.isWeatherNotifications())
                .twoFactorAuth(s.isTwoFactorAuth())
                .activityLog(s.isActivityLog())
                .themePreference(s.getThemePreference())
                .languagePreference(s.getLanguagePreference())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
