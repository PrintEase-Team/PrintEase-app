package com.group108.printease.controller;

import com.group108.printease.dto.NotificationsDto;
import com.group108.printease.service.NotificationsService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/notifications")
@AllArgsConstructor
public class NotificationsController {

    private final NotificationsService notificationsService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationsDto>> getUserNotifications(@PathVariable("userId") UUID userId) {
        List<NotificationsDto> notifications = notificationsService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationsDto> markAsRead(@PathVariable("notificationId") UUID notificationId) {
        NotificationsDto notification = notificationsService.markAsRead(notificationId);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<String> markAllAsRead(@PathVariable("userId") UUID userId) {
        notificationsService.markAllAsRead(userId);
        return ResponseEntity.ok("All notifications marked as read.");
    }
}
