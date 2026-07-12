package com.group108.printease.service.impl;

import com.group108.printease.dto.UsersDto;
import com.group108.printease.entities.Users;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.Usersmapper;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.service.UsersService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Builder
@AllArgsConstructor
public class UsersServiceimpl implements UsersService {
    private final UsersRepository usersRepository;


    @Override
    public UsersDto createUser(UsersDto usersDto) {

        Users users = Usersmapper.mapsToUsers(usersDto);
        Users saveduser = usersRepository.save(users);
        return Usersmapper.mapToUserDto(saveduser);
    }

    @Override
    public UsersDto getUser(UUID UserId) {
       Users users = usersRepository.findById(UserId)
                .orElseThrow(() -> new ResourceNotFoundException("No user exists with this Id"+UserId));
        return Usersmapper.mapToUserDto(users);
    }

    @Override
    public List<UsersDto> getAllUsers() {
        List<Users> users = usersRepository.findAll();
        return users.stream().map(Usersmapper::mapToUserDto)
                .toList();
    }

    @Override
    public UsersDto updateUser(UUID user_id, UsersDto updateUser) {
        Users users = usersRepository.findById(user_id).orElseThrow(
                ()-> new ResourceNotFoundException("User does not exist with "+ user_id)
        );

        if (updateUser.getFull_name() != null)
            users.setFull_name(updateUser.getFull_name());
        if (updateUser.getEmail() != null)
            users.setEmail(updateUser.getEmail());
        if (updateUser.getPassword_hash() != null)
            users.setPassword_hash(updateUser.getPassword_hash());
        if (updateUser.getRole() != null)
            users.setRole(updateUser.getRole());
        if (updateUser.getPhone_number() != null)
            users.setPhone_number(updateUser.getPhone_number());
        if (updateUser.getStudent_index_number() != null)
            users.setStudent_index_number(updateUser.getStudent_index_number());
        if (updateUser.getCreated_at() != null)
            users.setCreated_at(updateUser.getCreated_at());
        if (updateUser.getUpdated_at() != null)
            users.setUpdated_at(updateUser.getUpdated_at());
        if (updateUser.getLast_login_at() != null)
            users.setLast_login_at(updateUser.getLast_login_at());
        if (updateUser.getIs_active() != null) {
            users.set_active(updateUser.getIs_active());
        }

        Users updatedUser = usersRepository.save(users);
        return Usersmapper.mapToUserDto(updatedUser);
    }

    @Override
    public UsersDto setDefaultShop(UUID userId, UUID shopId) {
        Users users = usersRepository.findById(userId).orElseThrow(
                ()-> new ResourceNotFoundException("User does not exist with "+ userId)
        );
        users.setDefault_shop_id(shopId);
        Users updatedUser = usersRepository.save(users);
        return Usersmapper.mapToUserDto(updatedUser);
    }

    @Override
    public UsersDto setPushToken(UUID userId, String token) {
        Users users = usersRepository.findById(userId).orElseThrow(
                ()-> new ResourceNotFoundException("User does not exist with "+ userId)
        );
        users.setExpo_push_token(token);
        Users updatedUser = usersRepository.save(users);
        return Usersmapper.mapToUserDto(updatedUser);
    }

    @Override
    public UsersDto setDefaultLocation(UUID userId, String locationName, Double latitude, Double longitude) {
        Users users = usersRepository.findById(userId).orElseThrow(
                ()-> new ResourceNotFoundException("User does not exist with "+ userId)
        );
        users.setDefault_location_name(locationName);
        users.setDefault_latitude(latitude);
        users.setDefault_longitude(longitude);
        Users updatedUser = usersRepository.save(users);
        return Usersmapper.mapToUserDto(updatedUser);
    }

    @Override
    public void deleteUsers(UUID user_id) {
      Users users= usersRepository.findById(user_id)
                .orElseThrow(
                        ()->new ResourceNotFoundException("No user exist with user id "+ user_id)
                );
        users.set_active(false);
        usersRepository.save(users);

    }
}
