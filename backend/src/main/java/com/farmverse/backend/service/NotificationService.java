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
        n4.setMessage("Clear skies and moderate humidity expected over the next 48 hours. Optimal window for fertilizer application.");
        n4.setType("info");
        n4.setCategory("WEATHER");
        n4.setLink("/weather");
        n4.setRead(true);
        n4.setCreatedAt(LocalDateTime.now().minusDays(1));
        notificationRepo.save(n4);

        return List.of(n1, n2, n3, n4);
    }
}
