package com.group108.printease.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private java.util.UUID userId;

    @com.fasterxml.jackson.annotation.JsonProperty("user_id")
    public java.util.UUID getUser_id() {
        return userId;
    }

}
