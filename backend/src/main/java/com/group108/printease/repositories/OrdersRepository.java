package com.group108.printease.repositories;

import com.group108.printease.entities.Orders;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface OrdersRepository extends JpaRepository<Orders, UUID> {
    @Query("SELECT o FROM Orders o WHERE o.student_id.user_id = :studentId")
    List<Orders> findOrdersByStudentId(@Param("studentId") UUID studentId);

    @Query("SELECT o FROM Orders o WHERE o.shop.shop_id = :shopId")
    List<Orders> findOrdersByShopId(@Param("shopId") UUID shopId);

    @Query("SELECT o FROM Orders o WHERE o.shop.shop_id = :shopId AND o.status IN ('Pending', 'Printing')")
    List<Orders> findActiveOrdersByShopId(@Param("shopId") UUID shopId);

    @Query("SELECT o FROM Orders o WHERE o.status = :status AND o.submitted_at < :cutoffDate")
    List<Orders> findOrdersByStatusAndDateBefore(@Param("status") Orders.order_status status, @Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}