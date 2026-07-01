package com.group108.printease.repositories;

import com.group108.printease.entities.PrintShops;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PrintShopsRepository extends JpaRepository<PrintShops, UUID> {
    @Query("SELECT s FROM PrintShops s WHERE s.vendor.user_id = :vendorId")
    Optional<PrintShops> findByVendorId(@Param("vendorId") UUID vendorId);
}
