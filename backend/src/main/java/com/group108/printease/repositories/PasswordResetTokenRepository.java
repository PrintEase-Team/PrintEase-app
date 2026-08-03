package com.group108.printease.repositories;

import com.group108.printease.entities.PasswordResetToken;
import com.group108.printease.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @Query("SELECT p FROM PasswordResetToken p WHERE p.otp = :otp")
    Optional<PasswordResetToken> fetchByOtp(@Param("otp") String otp);

    @Query("SELECT p FROM PasswordResetToken p WHERE p.user = :user")
    Optional<PasswordResetToken> fetchByUser(@Param("user") Users user);
}
