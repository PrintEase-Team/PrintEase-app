package com.group108.printease.service;

import com.group108.printease.dto.UsersDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public interface UsersService {
    UsersDto createUser (UsersDto usersDto);
    UsersDto getUser (UUID UserId);
    List<UsersDto> getAllUsers();
    UsersDto updateUser(UUID user_id ,UsersDto updateUser);
    UsersDto setDefaultShop(UUID userId, UUID shopId);
    UsersDto setPushToken(UUID userId, String token);
    UsersDto setDefaultLocation(UUID userId, String locationName, Double latitude, Double longitude);
    void deleteUsers(UUID user_id);
}
