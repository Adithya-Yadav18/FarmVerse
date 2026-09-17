package com.farmverse.backend.service;

import com.farmverse.backend.dto.NotificationDTO;
import com.farmverse.backend.entity.NotificationEntity;
import com.farmverse.backend.entity.User;
import com.farmverse.backend.repository.NotificationRepository;
import com.farmverse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;

    public NotificationService(NotificationRepository notificationRepo, UserRepository userRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    public List<NotificationEntity> getNotifications(String userEmail) {
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        List<NotificationEntity> list = notificationRepo.findByUserOrderByCreatedAtDesc(user);
        if (list.isEmpty()) {
            list = seedInitialNotifications(user);
        } else {
            // Check if existing notifications are from legacy generic seed and need role sanitization
            String role = user.getRole() != null ? user.getRole().toUpperCase() : "";
            boolean isNormalUser = role.contains("NORMAL") || role.contains("USER");
            boolean hasForbiddenLinks = isNormalUser && list.stream().anyMatch(n ->
                n.getLink() != null && (n.getLink().equals("/irrigation") || n.getLink().equals("/disease") || n.getLink().equals("/soil"))
            );
            if (hasForbiddenLinks) {
                notificationRepo.deleteAll(list);
                list = seedInitialNotifications(user);
            }
        }
        return list;
    }

    public NotificationDTO.UnreadCountResponse getUnreadCount(String userEmail) {
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long count = notificationRepo.countByUserAndReadFalse(user);
        return new NotificationDTO.UnreadCountResponse(count);
    }

    @Transactional
    public NotificationEntity markAsRead(Long id, String userEmail) {
        NotificationEntity notification = notificationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied: You cannot modify another user's notifications.");
        }

        notification.setRead(true);
        return notificationRepo.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        notificationRepo.markAllAsReadForUser(user);
    }

    @Transactional
    public void deleteNotification(Long id, String userEmail) {
        NotificationEntity notification = notificationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied: You cannot delete another user's notifications.");
        }

        notificationRepo.delete(notification);
    }

    @Transactional
    public NotificationEntity createNotification(User user, String title, String message, String type, String category, String link) {
        NotificationEntity notif = new NotificationEntity();
        notif.setUser(user);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type != null ? type : "info");
        notif.setCategory(category != null ? category : "SYSTEM");
        notif.setLink(link);
        notif.setRead(false);
        notif.setCreatedAt(LocalDateTime.now());
        return notificationRepo.save(notif);
    }

    private synchronized List<NotificationEntity> seedInitialNotifications(User user) {
        List<NotificationEntity> existing = notificationRepo.findByUserOrderByCreatedAtDesc(user);
        if (!existing.isEmpty()) {
            return existing;
        }

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "ROLE_FARMER";

        if (role.contains("NORMAL") || role.contains("USER")) {
            // Seed consumer-specific notifications
            NotificationEntity n1 = new NotificationEntity();
            n1.setUser(user);
            n1.setTitle("Fresh APMC Arrivals & Mandi Rates");
            n1.setMessage("Modal rates for tomatoes, onions, and seasonal fruits updated for regional mandis. Check local price spreads before shopping.");
            n1.setType("info");
            n1.setCategory("MARKET");
            n1.setLink("/mandi");
            n1.setRead(false);
            n1.setCreatedAt(LocalDateTime.now().minusMinutes(25));
            notificationRepo.save(n1);

            NotificationEntity n2 = new NotificationEntity();
            n2.setUser(user);
            n2.setTitle("100% Pesticide-Free Harvest Certified");
            n2.setMessage("Organic produce batch FV-2026-8819 passed lab purity verification with zero chemical pesticide residues.");
            n2.setType("success");
            n2.setCategory("TRACEABILITY");
            n2.setLink("/traceability");
            n2.setRead(false);
            n2.setCreatedAt(LocalDateTime.now().minusHours(2));
            notificationRepo.save(n2);

            NotificationEntity n3 = new NotificationEntity();
            n3.setUser(user);
            n3.setTitle("Weekend Agro-Climate Outlook");
            n3.setMessage("Clear skies and mild temperatures expected across regional markets. Optimal conditions for visiting local farm-to-table bazaars.");
            n3.setType("info");
            n3.setCategory("WEATHER");
            n3.setLink("/weather");
            n3.setRead(false);
            n3.setCreatedAt(LocalDateTime.now().minusHours(6));
            notificationRepo.save(n3);

            NotificationEntity n4 = new NotificationEntity();
            n4.setUser(user);
            n4.setTitle("Seasonal Nutritional Intelligence");
            n4.setMessage("AI advisory recommendation: Peak harvest season for nutrient-rich pulses, root vegetables, and leafy greens.");
            n4.setType("success");
            n4.setCategory("ADVISORY");
            n4.setLink("/ai-recommendations");
            n4.setRead(true);
            n4.setCreatedAt(LocalDateTime.now().minusDays(1));
            notificationRepo.save(n4);

            return List.of(n1, n2, n3, n4);
        } else if (role.contains("AGRONOMIST")) {
            // Seed agronomist scientific & triage notifications
            NotificationEntity n1 = new NotificationEntity();
            n1.setUser(user);
            n1.setTitle("Urgent: Early Blight Spore Alert");
            n1.setMessage("Elevated fungal spore index detected in regional tomato plots. Organic bio-control (Neem Oil 1500ppm) protocol recommended.");
            n1.setType("warning");
            n1.setCategory("DISEASE");
            n1.setLink("/disease");
            n1.setRead(false);
            n1.setCreatedAt(LocalDateTime.now().minusMinutes(20));
            notificationRepo.save(n1);

            NotificationEntity n2 = new NotificationEntity();
            n2.setUser(user);
            n2.setTitle("Soil Telemetry: Nitrogen Deficiency");
            n2.setMessage("Soil sensor lab report indicates sub-optimal nitrogen (162 kg/ha) and elevated EC in Sector 3. Bio-fertilizer application required.");
            n2.setType("error");
            n2.setCategory("SOIL");
            n2.setLink("/soil");
            n2.setRead(false);
            n2.setCreatedAt(LocalDateTime.now().minusHours(1));
            notificationRepo.save(n2);

            NotificationEntity n3 = new NotificationEntity();
            n3.setUser(user);
            n3.setTitle("Satellite NDVI Crop Vigor Anomaly");
            n3.setMessage("Sentinel-2 multispectral telemetry flags a chlorophyll deficit (NDVI < 0.40) in Field 2. Ground inspection advised.");
            n3.setType("warning");
            n3.setCategory("SATELLITE");
            n3.setLink("/satellite");
            n3.setRead(false);
            n3.setCreatedAt(LocalDateTime.now().minusHours(4));
            notificationRepo.save(n3);

            NotificationEntity n4 = new NotificationEntity();
            n4.setUser(user);
            n4.setTitle("Farmer SOS Emergency Distress Triage");
            n4.setMessage("New distress dossier lodged by farmer reporting severe leaf curl and wilting. Agronomist evaluation requested.");
            n4.setType("error");
            n4.setCategory("RESCUE");
            n4.setLink("/crop-rescue");
            n4.setRead(false);
            n4.setCreatedAt(LocalDateTime.now().minusHours(8));
            notificationRepo.save(n4);

            NotificationEntity n5 = new NotificationEntity();
            n5.setUser(user);
            n5.setTitle("Agro-Meteorological Leaching Risk");
            n5.setMessage("Moderate to heavy rainfall forecast over the next 48 hours. High vulnerability for topsoil nutrient runoff.");
            n5.setType("info");
            n5.setCategory("WEATHER");
            n5.setLink("/weather");
            n5.setRead(true);
            n5.setCreatedAt(LocalDateTime.now().minusDays(1));
            notificationRepo.save(n5);

            return List.of(n1, n2, n3, n4, n5);
        } else {
            // Default Farmer / Admin seed
            NotificationEntity n1 = new NotificationEntity();
            n1.setUser(user);
            n1.setTitle("Urgent: Low Soil Moisture Alert");
            n1.setMessage("Sensors recorded moisture level below 28% in main plot. Scheduled drip irrigation cycle recommended.");
            n1.setType("error");
            n1.setCategory("SOIL");
            n1.setLink("/irrigation");
            n1.setRead(false);
            n1.setCreatedAt(LocalDateTime.now().minusMinutes(25));
            notificationRepo.save(n1);

            NotificationEntity n2 = new NotificationEntity();
            n2.setUser(user);
            n2.setTitle("Pathology Alert: Early Blight Detected");
            n2.setMessage("AI foliar diagnosis confirmed early-stage Alternaria solani. Organic bio-control (Neem Oil 1500ppm) recommended.");
            n2.setType("warning");
            n2.setCategory("DISEASE");
            n2.setLink("/disease");
            n2.setRead(false);
            n2.setCreatedAt(LocalDateTime.now().minusHours(2));
            notificationRepo.save(n2);

            NotificationEntity n3 = new NotificationEntity();
            n3.setUser(user);
            n3.setTitle("Smart Irrigation Completed");
            n3.setMessage("Automated cycle completed for Zone A. 2,400 Liters delivered with 94.2% water efficiency.");
            n3.setType("success");
            n3.setCategory("IRRIGATION");
            n3.setLink("/irrigation");
            n3.setRead(false);
            n3.setCreatedAt(LocalDateTime.now().minusHours(6));
            notificationRepo.save(n3);

            NotificationEntity n4 = new NotificationEntity();
            n4.setUser(user);
            n4.setTitle("Agro-Meteorological Advisory");
            n4.setMessage("Clear skies and moderate humidity expected over the next 48 hours. Optimal window for field operations.");
            n4.setType("info");
            n4.setCategory("WEATHER");
            n4.setLink("/weather");
            n4.setRead(true);
            n4.setCreatedAt(LocalDateTime.now().minusDays(1));
            notificationRepo.save(n4);

            return List.of(n1, n2, n3, n4);
        }
    }
}
