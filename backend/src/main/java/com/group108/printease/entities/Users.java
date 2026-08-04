package com.group108.printease.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "users_tbl", uniqueConstraints = {@UniqueConstraint(columnNames = {"email", "role"})})

public class Users implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public @Nullable String getPassword() {
        return password_hash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }

    public enum user_role{
        Student,
        Admin
    }
    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID userId;
    @Column(name = "full_name", nullable = false)
    private String full_name;
    @Column(name = "email", nullable = false)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String password_hash;
    @Column(name = "role")
    @Enumerated(EnumType.STRING)

    private user_role role;
    @Column(name = "phone_number")
    private String phone_number;
    @Column(name = "student_index_number", unique = true)
    private String student_index_number;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime created_at;
    @PrePersist
    protected void onCreate() {
        this.created_at = LocalDateTime.now();
    }
    @Column(name = "updated_at")
    private LocalDateTime updated_at;
    @Column(name = "last_login_at")
    private LocalDateTime last_login_at;
    @Column(name = "is_active", columnDefinition = "boolean default true")
    private boolean is_active;
    @Column(name = "is_verified", columnDefinition = "boolean default true")
    private boolean is_verified = true;
    @Column(name = "default_shop_id")
    private UUID default_shop_id;
    @Column(name = "expo_push_token")
    private String expo_push_token;
    @Column(name = "default_location_name")
    private String default_location_name;
    @Column(name = "default_latitude")
    private Double default_latitude;
    @Column(name = "default_longitude")
    private Double default_longitude;
}
