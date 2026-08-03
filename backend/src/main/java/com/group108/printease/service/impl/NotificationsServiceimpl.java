package com.group108.printease.service.impl;

import com.group108.printease.dto.NotificationsDto;
import com.group108.printease.entities.Notifications;
import com.group108.printease.entities.Users;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.NotificationsMapper;
import com.group108.printease.repositories.NotificationsRepository;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.service.NotificationsService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class NotificationsServiceimpl implements NotificationsService {

    private final NotificationsRepository notificationsRepository;
    private final UsersRepository usersRepository;

    @Override
    public NotificationsDto createNotification(UUID userId, String title, String message, String type) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Notifications notification = new Notifications();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIs_read(false);

        Notifications savedNotification = notificationsRepository.save(notification);
        return NotificationsMapper.mapToNotificationsDto(savedNotification);
    }

    @Override
    public List<NotificationsDto> getUserNotifications(UUID userId) {
        List<Notifications> notifications = notificationsRepository.fetchNotificationsByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 50));
        return notifications.stream()
                .map(NotificationsMapper::mapToNotificationsDto)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationsDto markAsRead(UUID notificationId) {
        Notifications notification = notificationsRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        notification.setIs_read(true);
        Notifications updatedNotification = notificationsRepository.save(notification);
        return NotificationsMapper.mapToNotificationsDto(updatedNotification);
    }

    @Override
    public void markAllAsRead(UUID userId) {
        List<Notifications> notifications = notificationsRepository.fetchNotificationsByUserId(userId);
        for (Notifications n : notifications) {
            if (!n.getIs_read()) {
                n.setIs_read(true);
            }
        }
        notificationsRepository.saveAll(notifications);
    }

    @Override
    public void clearAllNotifications(UUID userId) {
        notificationsRepository.deleteNotificationsByUserId(userId);
    }
}
