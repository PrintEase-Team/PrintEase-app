package com.group108.printease.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "otp_verifications_tbl")
public class OtpVerification {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "otp_code", nullable = false)
    private String otp_code;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expires_at;

    @Column(name = "is_verified", columnDefinition = "boolean default false")
    private boolean is_verified;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime created_at;

    @PrePersist
    protected void onCreate() {
        this.created_at = LocalDateTime.now();
    }
}
