package com.group108.printease.controller;

import com.group108.printease.service.OtpService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @Data
    public static class VerifyOtpRequest {
        private String email;
        private String otpCode;
    }

    @Data
    public static class ResendOtpRequest {
        private String email;
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        boolean isSuccess = otpService.verifyOtp(request.getEmail(), request.getOtpCode());

        if (isSuccess) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email verified successfully!"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or expired verification code."
            ));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest request) {
        otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "A new verification code has been sent to your email."
        ));
    }
}
