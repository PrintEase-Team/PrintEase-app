package com.group108.printease.mapper;

import com.group108.printease.dto.NotificationsDto;
import com.group108.printease.entities.Notifications;

public class NotificationsMapper {
    public static NotificationsDto mapToNotificationsDto(Notifications notification) {
        return new NotificationsDto(
                notification.getNotification_id(),
                notification.getUser() != null ? notification.getUser().getUser_id() : null,
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getIs_read(),
                notification.getCreated_at()
        );
    }

    public static Notifications mapToNotifications(NotificationsDto dto) {
        Notifications notification = new Notifications();
        notification.setNotification_id(dto.getNotification_id());
        notification.setTitle(dto.getTitle());
        notification.setMessage(dto.getMessage());
        notification.setType(dto.getType());
        notification.setIs_read(dto.getIs_read());
        notification.setCreated_at(dto.getCreated_at());
        return notification;
    }
}
