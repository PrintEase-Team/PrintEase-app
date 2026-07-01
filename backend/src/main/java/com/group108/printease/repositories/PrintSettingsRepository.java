package com.group108.printease.repositories;


import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Print_Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PrintSettingsRepository extends JpaRepository<Print_Settings, UUID> {
    @Modifying
    @Query("delete from Print_Settings p where p.order_id = :order")
    void deleteByOrder(@Param("order") Orders order);

    @Query("select p from Print_Settings p where p.order_id = :order")
    java.util.List<Print_Settings> findByOrder(@Param("order") Orders order);

}
