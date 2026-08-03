package com.group108.printease.service;

import com.group108.printease.entities.OtpVerification;
import com.group108.printease.entities.Users;
import com.group108.printease.repositories.OtpRepository;
import com.group108.printease.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final UsersRepository usersRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    private static final SecureRandom random = new SecureRandom();

    public String generateAndSendOtp(String email) {
        int number = 100000 + random.nextInt(900000);
        String otpCode = String.valueOf(number);

        OtpVerification verification = OtpVerification.builder()
                .email(email)
                .otp_code(otpCode)
                .expires_at(LocalDateTime.now().plusMinutes(10))
                .is_verified(false)
                .build();

        otpRepository.save(verification);

        log.info("=================================================");
        log.info("ðŸ”‘ GENERATED OTP FOR {}: [{}]", email, otpCode);
        log.info("=================================================");

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(email);
                    message.setSubject("PrintEase â€” Your Account Verification Code");
                    message.setText("Welcome to PrintEase!\n\nYour 6-digit verification code is: " + otpCode + "\n\nThis code will expire in 10 minutes.");
                    mailSender.send(message);
                    log.info("Successfully sent verification email to {}", email);
                } catch (Exception e) {
                    log.warn("Could not send email to {} via JavaMailSender: {}. (OTP is logged in console above!)", email, e.getMessage());
                }
            });
        }

        return otpCode;
    }

    public boolean verifyOtp(String email, String otpCode) {
        var opt = otpRepository.findLatestPendingByEmailAndCode(email, otpCode);
        if (opt.isEmpty()) {
            return false;
        }

        OtpVerification verification = opt.get();
        if (verification.getExpires_at().isBefore(LocalDateTime.now())) {
            return false;
        }

        verification.set_verified(true);
        otpRepository.save(verification);

        var userOpt = usersRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            Users user = userOpt.get();
            user.set_verified(true);
            usersRepository.save(user);
        }

        return true;
    }
}
