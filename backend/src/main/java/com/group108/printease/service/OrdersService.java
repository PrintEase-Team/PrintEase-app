package com.group108.printease.service;

import com.group108.printease.dto.OrdersDto;

import java.util.List;
import java.util.UUID;

public interface OrdersService {
    OrdersDto createOrders (OrdersDto ordersDto);
    OrdersDto getOrders(UUID order_id);
    List<OrdersDto> getAllOrders();
    List<OrdersDto> getOrdersByStudent(UUID studentId);
    List<OrdersDto> getOrdersByShop(UUID shopId);
    OrdersDto updateOrders (UUID order_id, OrdersDto updateOrders);
    void deleteOrders (UUID order_id);

}
