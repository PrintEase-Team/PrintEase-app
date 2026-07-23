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
        return new Users(
                usersDto.getUser_id(),
                usersDto.getFull_name(),
                usersDto.getEmail(),
                usersDto.getPassword_hash(),
                usersDto.getRole(),
                usersDto.getPhone_number(),
                usersDto.getStudent_index_number(),
                usersDto.getCreated_at(),
                usersDto.getUpdated_at(),
                usersDto.getLast_login_at(),
                usersDto.getIs_active(),
                usersDto.getDefault_shop_id(),
                usersDto.getExpo_push_token(),
                usersDto.getDefault_location_name(),
                usersDto.getDefault_latitude(),
                usersDto.getDefault_longitude()
        );
    }
}
