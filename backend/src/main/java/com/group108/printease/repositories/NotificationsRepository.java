package com.group108.printease.repositories;

import com.group108.printease.entities.Notifications;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationsRepository extends JpaRepository<Notifications, UUID> {
    @Query("SELECT n FROM Notifications n WHERE n.user.user_id = :userId ORDER BY n.created_at DESC")
    List<Notifications> findByUserId(@Param("userId") UUID userId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT n FROM Notifications n WHERE n.user.user_id = :userId ORDER BY n.created_at DESC")
    List<Notifications> findByUserId(@Param("userId") UUID userId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Notifications n WHERE n.user.user_id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
