package com.group108.printease.mapper;

import com.group108.printease.dto.PrintShopsDto;
import com.group108.printease.entities.PrintShops;

public class PrintShopsMapper {

    public static PrintShopsDto mapToPrintShopsDto(PrintShops printShop) {
        return new PrintShopsDto(
                printShop.getShop_id(),
                printShop.getVendor() != null ? printShop.getVendor().getUserId() : null,
                printShop.getShop_name(),
                printShop.getLocation(),
                printShop.getPhone_number(),
                printShop.getOperating_hours(),
                printShop.getIs_active(),
                printShop.getStatus_override(),
                printShop.getOverride_expires_at(),
                printShop.getProfile_picture_url(),
                printShop.getBanner_picture_url(),
                printShop.getLatitude(),
                printShop.getLongitude(),
                printShop.getAverage_rating(),
                printShop.getTotal_ratings(),
                printShop.getAdditional_location_details(),
                printShop.getServices_offered(),
                printShop.getEstablished_year(),
                printShop.getPrice_a4_bw(),
                printShop.getPrice_a4_color(),
                printShop.getPrice_a3_bw(),
                printShop.getPrice_a3_color(),
                printShop.getPrice_letter_bw(),
                printShop.getPrice_letter_color(),
                printShop.getSupports_a4(),
                printShop.getSupports_a3(),
                printShop.getSupports_letter(),
                printShop.getSupports_binding(),
                printShop.getBinding_pricing(),
                printShop.getSupports_lamination(),
                printShop.getPrice_lamination_a4(),
                printShop.getPrice_lamination_a3(),
                printShop.getPrice_lamination_letter()
        );
    }

    public static PrintShops mapToPrintShops(PrintShopsDto dto) {
        PrintShops printShop = new PrintShops();
        printShop.setShop_id(dto.getShop_id());
        printShop.setShop_name(dto.getShop_name());
        printShop.setLocation(dto.getLocation());
        printShop.setPhone_number(dto.getPhone_number());
        printShop.setOperating_hours(dto.getOperating_hours());
        printShop.setIs_active(dto.getIs_active());
        if (dto.getStatus_override() != null) printShop.setStatus_override(dto.getStatus_override());
        if (dto.getOverride_expires_at() != null) printShop.setOverride_expires_at(dto.getOverride_expires_at());
        printShop.setProfile_picture_url(dto.getProfile_picture_url());
        printShop.setBanner_picture_url(dto.getBanner_picture_url());
        printShop.setLatitude(dto.getLatitude());
        printShop.setLongitude(dto.getLongitude());
        if (dto.getAverage_rating() != null) printShop.setAverage_rating(dto.getAverage_rating());
        if (dto.getTotal_ratings() != null) printShop.setTotal_ratings(dto.getTotal_ratings());
        printShop.setAdditional_location_details(dto.getAdditional_location_details());
        printShop.setServices_offered(dto.getServices_offered());
        printShop.setEstablished_year(dto.getEstablished_year());
        if (dto.getPrice_a4_bw() != null) printShop.setPrice_a4_bw(dto.getPrice_a4_bw());
        if (dto.getPrice_a4_color() != null) printShop.setPrice_a4_color(dto.getPrice_a4_color());
        if (dto.getPrice_a3_bw() != null) printShop.setPrice_a3_bw(dto.getPrice_a3_bw());
        if (dto.getPrice_a3_color() != null) printShop.setPrice_a3_color(dto.getPrice_a3_color());
        if (dto.getPrice_letter_bw() != null) printShop.setPrice_letter_bw(dto.getPrice_letter_bw());
        if (dto.getPrice_letter_color() != null) printShop.setPrice_letter_color(dto.getPrice_letter_color());
        if (dto.getSupports_a4() != null) printShop.setSupports_a4(dto.getSupports_a4());
        if (dto.getSupports_a3() != null) printShop.setSupports_a3(dto.getSupports_a3());
        if (dto.getSupports_letter() != null) printShop.setSupports_letter(dto.getSupports_letter());
        if (dto.getSupports_binding() != null) printShop.setSupports_binding(dto.getSupports_binding());
        if (dto.getBinding_pricing() != null) printShop.setBinding_pricing(dto.getBinding_pricing());
        if (dto.getSupports_lamination() != null) printShop.setSupports_lamination(dto.getSupports_lamination());
        if (dto.getPrice_lamination_a4() != null) printShop.setPrice_lamination_a4(dto.getPrice_lamination_a4());
        if (dto.getPrice_lamination_a3() != null) printShop.setPrice_lamination_a3(dto.getPrice_lamination_a3());
        if (dto.getPrice_lamination_letter() != null) printShop.setPrice_lamination_letter(dto.getPrice_lamination_letter());
        return printShop;
    }
}
