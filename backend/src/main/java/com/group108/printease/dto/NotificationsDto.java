package com.group108.printease.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationsDto {
    private UUID notification_id;
    private UUID userId;
    private String title;
    private String message;
    private String type;
    private Boolean is_read;
    private LocalDateTime created_at;
}
