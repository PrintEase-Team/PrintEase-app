package com.group108.printease.mapper;

import com.group108.printease.dto.UsersDto;
import com.group108.printease.entities.Users;

public class Usersmapper {
    public static UsersDto mapToUserDto(Users users) {
        return new UsersDto(
                users.getUser_id(),
                users.getFull_name(),
                users.getEmail(),
                users.getPassword_hash(),
                users.getRole(),
                users.getPhone_number(),
                users.getStudent_index_number(),
                users.getCreated_at(),
                users.getUpdated_at(),
                users.getLast_login_at(),
                users.is_active(),
                users.getDefault_shop_id(),
                users.getExpo_push_token(),
                users.getDefault_location_name(),
                users.getDefault_latitude(),
                users.getDefault_longitude()
        );
    }

    public static Users mapsToUsers(UsersDto usersDto) {
        return Users.builder()
                .user_id(usersDto.getUser_id())
                .full_name(usersDto.getFull_name())
                .email(usersDto.getEmail())
                .password_hash(usersDto.getPassword_hash())
                .role(usersDto.getRole())
                .phone_number(usersDto.getPhone_number())
                .student_index_number(usersDto.getStudent_index_number())
                .created_at(usersDto.getCreated_at())
                .updated_at(usersDto.getUpdated_at())
                .last_login_at(usersDto.getLast_login_at())
                .is_active(usersDto.getIs_active() != null ? usersDto.getIs_active() : true)
                .default_shop_id(usersDto.getDefault_shop_id())
                .expo_push_token(usersDto.getExpo_push_token())
                .default_location_name(usersDto.getDefault_location_name())
                .default_latitude(usersDto.getDefault_latitude())
                .default_longitude(usersDto.getDefault_longitude())
                .build();
    }
}
