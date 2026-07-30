package com.group108.printease.mapper;

import com.group108.printease.dto.OrdersDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Users;
import com.group108.printease.entities.PrintShops;

public class Ordersmapper {

    public static OrdersDto mapToOrdersDto(Orders orders) {
        return new OrdersDto(
                orders.getOrder_id(),
                orders.getStudent_id() != null ? orders.getStudent_id().getUser_id() : null,
                orders.getShop() != null ? orders.getShop().getShop_id() : null,
                orders.getPickup_code(),
                orders.getStatus(),
                orders.getEstimated_ready_time(),
                orders.getPriority(),
                orders.getSubmitted_at(),
                orders.getReady_at(),
                orders.getCollected_at(),
                orders.isNotified(),
                null, // payment_amount
                null, // items
                orders.getStudent_id() != null ? orders.getStudent_id().getFull_name() : null, // student_name
                orders.getStudent_id() != null ? orders.getStudent_id().getPhone_number() : null, // student_phone
                null, // shop_name
                null,  // shop_location
                orders.is_rated() // is_rated
        );
    }

    public static Orders mapToOrders(OrdersDto ordersDto, Users student, PrintShops shop) {
        Orders orders = new Orders();
        orders.setOrder_id(ordersDto.getOrder_id());
        orders.setStudent_id(student);
        orders.setShop(shop);
        orders.setPickup_code(ordersDto.getPickup_code());
        orders.setStatus(ordersDto.getStatus());
        orders.setEstimated_ready_time(ordersDto.getEstimated_ready_time());
        orders.setPriority(ordersDto.getPriority());
        orders.setReady_at(ordersDto.getReady_at());
        orders.setCollected_at(ordersDto.getCollected_at());
        if (ordersDto.getNotified() != null) {
            orders.setNotified(ordersDto.getNotified());
        }
        return orders;
    }
}