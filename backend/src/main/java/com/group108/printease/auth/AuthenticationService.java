package com.group108.printease.auth;

import com.group108.printease.config.JWTService;
import com.group108.printease.entities.PrintShops;
import com.group108.printease.entities.Users;
import com.group108.printease.repositories.PrintShopsRepository;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.repositories.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UsersRepository repository;
    private final PrintShopsRepository printShopsRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.group108.printease.service.OtpService otpService;


    public AuthenticationResponse register(RegisterRequest request) {
        Users.user_role userRole = Users.user_role.Student;
        if (request.getRole() != null && request.getRole().equalsIgnoreCase("Admin")) {
            userRole = Users.user_role.Admin;
        }

        if (repository.existsByEmailAndRole(request.getEmail(), userRole)) {
            throw new IllegalArgumentException("An account with email " + request.getEmail() + " is already registered as a " + userRole + ". Please sign in.");
        }

        var user = Users.builder()
                .full_name(request.getFullname())
                .email(request.getEmail())
                .password_hash(passwordEncoder.encode(request.getPassword()))
                .phone_number(request.getPhoneNumber())
                .role(userRole)
                .is_verified(true)
                .default_location_name(request.getDefaultLocationName())
                .default_latitude(request.getDefaultLatitude())
                .default_longitude(request.getDefaultLongitude())
                .build();
        var savedUser = repository.save(user);

        // Auto-create shop if vendor
        if (userRole == Users.user_role.Admin) {
            PrintShops defaultShop = new PrintShops();
            defaultShop.setVendor(savedUser);
            defaultShop.setShop_name("My Print Shop");
            defaultShop.setLocation("Update Location");
            defaultShop.setPhone_number(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
            defaultShop.setOperating_hours("{}");
            defaultShop.setIs_active(true);
            printShopsRepository.save(defaultShop);
        }

        var jwtToken = jwtService.generateToken(savedUser);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .userId(savedUser.getUserId())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        Users.user_role targetRole = Users.user_role.Student;
        if (request.getRole() != null && request.getRole().equalsIgnoreCase("Admin")) {
            targetRole = Users.user_role.Admin;
        }

        final Users.user_role finalRole = targetRole;
        Users user = repository.findByEmailAndRole(request.getEmail(), finalRole)
                .or(() -> repository.findAllByEmail(request.getEmail()).stream().filter(u -> u.getRole() == finalRole).findFirst())
                .or(() -> repository.findAllByEmail(request.getEmail()).stream().findFirst())
                .orElseThrow(()-> new UsernameNotFoundException("User does not exist with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword_hash())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .userId(user.getUserId())
                .build();
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        var user = repository.findAllByEmail(request.getEmail()).stream().findFirst()
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Generate 6 digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        // Invalidate old tokens
        passwordResetTokenRepository.fetchByUser(user).ifPresent(passwordResetTokenRepository::delete);

        com.group108.printease.entities.PasswordResetToken resetToken = com.group108.printease.entities.PasswordResetToken.builder()
                .user(user)
                .otp(otp)
                .expiryDate(java.time.LocalDateTime.now().plusMinutes(15))
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Simulate sending email by printing to console
        System.out.println("=========================================================");
        System.out.println("SIMULATED EMAIL SENT TO: " + request.getEmail());
        System.out.println("YOUR PASSWORD RESET OTP IS: " + otp);
        System.out.println("=========================================================");
    }

    public void resetPassword(ResetPasswordRequest request) {
        var token = passwordResetTokenRepository.fetchByOtp(request.getOtp())
                .orElseThrow(() -> new IllegalArgumentException("Invalid OTP"));

        if (token.isExpired()) {
            passwordResetTokenRepository.delete(token);
            throw new IllegalArgumentException("OTP has expired");
        }

        if (!token.getUser().getEmail().equals(request.getEmail())) {
            throw new IllegalArgumentException("OTP does not match email");
        }

        var user = token.getUser();
        user.setPassword_hash(passwordEncoder.encode(request.getNewPassword()));
        repository.save(user);
        passwordResetTokenRepository.delete(token);
    }
}
