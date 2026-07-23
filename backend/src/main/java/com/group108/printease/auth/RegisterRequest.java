package com.group108.printease.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String fullname;
    private String email;
    private String password;
    private String phoneNumber;
    private String role; // "Student" or "Admin"
    private String defaultLocationName;
    private Double defaultLatitude;
    private Double defaultLongitude;
}
