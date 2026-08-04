package com.group108.printease.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService service;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.web.bind.annotation.GetMapping("/schema/fix")
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

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request
    ){
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody AuthenticationRequest request
    ){
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        service.forgotPassword(request);
        return ResponseEntity.ok("OTP sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        service.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully");
    }
}
