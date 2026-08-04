package com.group108.printease.controller;

import com.group108.printease.dto.UsersDto;
import com.group108.printease.service.UsersService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {
    private final UsersService usersService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/schema/fix")
    public ResponseEntity<String> fixSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE users_tbl DROP CONSTRAINT IF EXISTS uk8usegh22yymqae5jjt4pdbd3k CASCADE");
            jdbcTemplate.execute("DROP INDEX IF EXISTS uk8usegh22yymqae5jjt4pdbd3k CASCADE");
            jdbcTemplate.execute("ALTER TABLE users_tbl DROP CONSTRAINT IF EXISTS users_tbl_email_key CASCADE");
            jdbcTemplate.execute("DROP INDEX IF EXISTS users_tbl_email_key CASCADE");
            return ResponseEntity.ok("Schema fixed successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Schema fix error: " + e.getMessage());
        }
    }
    //Build Add User Rest Api
    @PostMapping
    public ResponseEntity <UsersDto> createuser(@RequestBody UsersDto usersDto){
        UsersDto saveduser = usersService.createUser(usersDto);
        return new ResponseEntity<>(saveduser, HttpStatus.CREATED);
    }
    //Build Get User Rest API
    @GetMapping("{id}")
    public ResponseEntity<UsersDto> getUser(@PathVariable("id") UUID userId){
        UsersDto usersDto= usersService.getUser(userId);
        return ResponseEntity.ok(usersDto);
    }

    //REST API to get all users
    @GetMapping
    public ResponseEntity<List<UsersDto>> getAllUsers(){
        List<UsersDto>users =usersService.getAllUsers();
        return  ResponseEntity.ok(users);
    }

    //REST API to update a user
    @PutMapping("{id}")
    public ResponseEntity<UsersDto> updateUsers(@PathVariable("id") UUID userId, @RequestBody UsersDto updateDto){
        UsersDto usersDto = usersService.updateUser(userId,updateDto);
        return ResponseEntity.ok(usersDto);
    }

    //REST API TO DELETE A USER
    @DeleteMapping("{id}")
    public ResponseEntity<String> deleteUsers(@PathVariable("id")UUID userId){
        usersService.deleteUsers(userId);
        return ResponseEntity.ok("User deleted Successfully.");
    }

    @PutMapping("{id}/default-shop")
    public ResponseEntity<UsersDto> setDefaultShop(@PathVariable("id") UUID userId, @RequestBody(required = false) java.util.Map<String, String> payload) {
        UUID shopId = null;
        if (payload != null && payload.get("shopId") != null) {
            shopId = UUID.fromString(payload.get("shopId"));
        }
        UsersDto usersDto = usersService.setDefaultShop(userId, shopId);
        return ResponseEntity.ok(usersDto);
    }

    @PutMapping("{id}/push-token")
    public ResponseEntity<UsersDto> setPushToken(@PathVariable("id") UUID userId, @RequestBody java.util.Map<String, String> payload) {
        String token = payload.get("token");
        UsersDto usersDto = usersService.setPushToken(userId, token);
        return ResponseEntity.ok(usersDto);
    }

    @PutMapping("{id}/default-location")
    public ResponseEntity<UsersDto> setDefaultLocation(@PathVariable("id") UUID userId, @RequestBody java.util.Map<String, Object> payload) {
        String locationName = payload.get("locationName") != null ? payload.get("locationName").toString() : null;
        Double latitude = payload.get("latitude") != null ? Double.parseDouble(payload.get("latitude").toString()) : null;
        Double longitude = payload.get("longitude") != null ? Double.parseDouble(payload.get("longitude").toString()) : null;
        
        UsersDto usersDto = usersService.setDefaultLocation(userId, locationName, latitude, longitude);
        return ResponseEntity.ok(usersDto);
    }
}
