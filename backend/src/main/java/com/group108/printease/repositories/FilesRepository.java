package com.group108.printease.repositories;



import com.group108.printease.entities.Files;
import com.group108.printease.entities.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface FilesRepository extends JpaRepository<Files, UUID> {
    @Modifying
    @Query("delete from Files f where f.order_id = :order")
    void deleteByOrder(@Param("order") Orders order);

    @Query("select f from Files f where f.order_id = :order")
    java.util.List<Files> findByOrder(@Param("order") Orders order);

}
