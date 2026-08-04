package com.group108.printease.repositories;

import com.group108.printease.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsersRepository extends JpaRepository<Users, UUID> {

    List<Users> findAllByEmail(String email);
    Optional<Users> findByEmail(String email);
    Optional<Users> findByEmailAndRole(String email, Users.user_role role);
    boolean existsByEmail(String email);
    boolean existsByEmailAndRole(String email, Users.user_role role);
}
