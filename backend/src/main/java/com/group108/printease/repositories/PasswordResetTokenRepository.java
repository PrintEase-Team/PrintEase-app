package com.group108.printease.repositories;

import com.group108.printease.entities.PasswordResetToken;
import com.group108.printease.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByOtp(String otp);
    Optional<PasswordResetToken> findByUser(Users user);
}
