package com.group108.printease.repositories;

import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Payments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payments, UUID> {
    @Query("SELECT p FROM Payments p WHERE p.order_id = :order")
    List<Payments> findByOrder(@Param("order") Orders order);
}
