package com.group108.printease.repositories;

import com.group108.printease.entities.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<OtpVerification, UUID> {
    Optional<OtpVerification> findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc(String email);
    Optional<OtpVerification> findTopByEmailAndOtpCodeAndIsVerifiedFalseOrderByCreatedAtDesc(String email, String otpCode);
}
