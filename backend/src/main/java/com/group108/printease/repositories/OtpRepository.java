package com.group108.printease.repositories;

import com.group108.printease.entities.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<OtpVerification, UUID> {

    @Query("SELECT o FROM OtpVerification o WHERE o.email = :email AND o.is_verified = false ORDER BY o.created_at DESC LIMIT 1")
    Optional<OtpVerification> findLatestPendingByEmail(@Param("email") String email);

    @Query("SELECT o FROM OtpVerification o WHERE o.email = :email AND o.otp_code = :otpCode AND o.is_verified = false ORDER BY o.created_at DESC LIMIT 1")
    Optional<OtpVerification> findLatestPendingByEmailAndCode(@Param("email") String email, @Param("otpCode") String otpCode);
}
