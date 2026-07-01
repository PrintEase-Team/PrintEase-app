package com.group108.printease.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "print_shops")
public class PrintShops {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID shop_id;

    @OneToOne
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Users vendor;

    @Column(nullable = false)
    private String shop_name;

    @Column
    private String location;

    @Column
    private String phone_number;

    @Column(columnDefinition = "TEXT")
    private String operating_hours;

    @Column(nullable = false)
    private Boolean is_active = true;

    @Column
    private String status_override = "NONE";

    @Column
    private java.time.LocalDateTime override_expires_at;

    @Column
    private String profile_picture_url;

    @Column
    private String banner_picture_url;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(columnDefinition = "double precision default 0.0")
    private Double average_rating = 0.0;

    @Column(columnDefinition = "integer default 0")
    private Integer total_ratings = 0;

    @Column(columnDefinition = "TEXT")
    private String additional_location_details;

    @Column(columnDefinition = "TEXT")
    private String services_offered;

    @Column
    private String established_year;

    @Column
    private Double price_a4_bw = 0.5;

    @Column
    private Double price_a4_color = 1.0;

    @Column
    private Double price_a3_bw = 1.0;

    @Column
    private Double price_a3_color = 2.0;

    @Column
    private Double price_letter_bw = 0.6;

    @Column
    private Double price_letter_color = 1.2;

    @Column
    private Boolean supports_a4 = true;

    @Column
    private Boolean supports_a3 = false;

    @Column
    private Boolean supports_letter = false;

    @Column
    private Boolean supports_binding = false;

    @Column
    private String binding_pricing = "[{\"min\": 1, \"max\": 100, \"price\": 12.00}]";

    @Column
    private Boolean supports_lamination = false;

    @Column
    private Double price_lamination_a4 = 5.0;

    @Column
    private Double price_lamination_a3 = 8.0;

    @Column
    private Double price_lamination_letter = 5.0;

}
