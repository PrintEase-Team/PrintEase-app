package com.group108.printease.dto;

import com.group108.printease.entities.Users;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class UsersDto {
    private UUID user_id;
    private String full_name;
    private String email;
    private String password_hash;
    @Enumerated(EnumType.STRING)
    private Users.user_role role;
    private String phone_number;
    private String student_index_number;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
    private LocalDateTime last_login_at;
    private Boolean is_active;
    private UUID default_shop_id;
    private String expo_push_token;
    private String default_location_name;
    private Double default_latitude;
    private Double default_longitude;
}
