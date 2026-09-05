package com.farmverse.backend.controller;

import com.farmverse.backend.dto.NotificationDTO;
import com.farmverse.backend.entity.NotificationEntity;
import com.farmverse.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationEntity>> getNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getNotifications(auth.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<NotificationDTO.UnreadCountResponse> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(notificationService.getUnreadCount(auth.getName()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationEntity> markAsRead(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(notificationService.markAsRead(id, auth.getName()));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, Authentication auth) {
        notificationService.deleteNotification(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
