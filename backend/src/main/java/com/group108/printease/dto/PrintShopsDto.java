package com.group108.printease.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrintShopsDto {
    private UUID shop_id;
    private UUID vendor_id;
    private String shop_name;
    private String location;
    private String phone_number;
    private String operating_hours;
    private Boolean is_active;
    private String status_override;
    private java.time.LocalDateTime override_expires_at;
    private String profile_picture_url;
    private String banner_picture_url;
    private Double latitude;
    private Double longitude;
    private Double average_rating;
    private Integer total_ratings;
    private String additional_location_details;
    private String services_offered;
    private String established_year;
    private Double price_a4_bw;
    private Double price_a4_color;
    private Double price_a3_bw;
    private Double price_a3_color;
    private Double price_letter_bw;
    private Double price_letter_color;
    private Boolean supports_a4;
    private Boolean supports_a3;
    private Boolean supports_letter;
    private Boolean supports_binding;
    private String binding_pricing;
    private Boolean supports_lamination;
    private Double price_lamination_a4;
    private Double price_lamination_a3;
    private Double price_lamination_letter;
}
