package com.group108.printease.service;

import com.group108.printease.dto.NotificationsDto;
import java.util.List;
import java.util.UUID;

public interface NotificationsService {
    NotificationsDto createNotification(UUID userId, String title, String message, String type);
    List<NotificationsDto> getUserNotifications(UUID userId);
    NotificationsDto markAsRead(UUID notificationId);
    void markAllAsRead(UUID userId);
}
