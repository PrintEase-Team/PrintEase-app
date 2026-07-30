package com.group108.printease.service.impl;

import com.group108.printease.dto.OrdersDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Users;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.Ordersmapper;
import com.group108.printease.repositories.FilesRepository;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import com.group108.printease.repositories.PrintShopsRepository;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.entities.PrintShops;
import com.group108.printease.service.OrdersService;
import com.group108.printease.service.NotificationsService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;

import com.group108.printease.repositories.PaymentRepository;
import com.group108.printease.dto.OrderItemDto;
import java.util.ArrayList;

@Service
@AllArgsConstructor
public class OrdersServiceimpl implements OrdersService {
    private final OrdersRepository ordersRepository;
    private final UsersRepository usersRepository;
    private final FilesRepository filesRepository;
    private final PrintSettingsRepository printSettingsRepository;
    private final PaymentRepository paymentRepository;
    private final PrintShopsRepository printShopsRepository;
    private final NotificationsService notificationsService;
    private final com.group108.printease.service.ExpoPushService expoPushService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Override
    public OrdersDto createOrders(OrdersDto ordersDto) {
        Users student = usersRepository.findById(ordersDto.getStudent_id())
                .orElseThrow(() -> new EntityNotFoundException(
                        "User not found with id: " + ordersDto.getStudent_id()));

        PrintShops shop = printShopsRepository.findById(ordersDto.getShop_id())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Shop not found with id: " + ordersDto.getShop_id()));

        Orders order = Ordersmapper.mapToOrders(ordersDto, student, shop);
        
        // Auto-generate pickup code
        java.security.SecureRandom random = new java.security.SecureRandom();
        String pickupCode = String.format("%06d", random.nextInt(1000000));
        order.setPickup_code(pickupCode);
        order.setStatus(Orders.order_status.Unpaid);
        
        // Auto-estimate ready time based on priority
        int baseWaitMinutes = 60; // 1 hour base wait
        if (order.getPriority() != null && order.getPriority() > 0) {
            baseWaitMinutes = 15; // 15 mins for high priority
        }
        order.setEstimated_ready_time(java.time.LocalDateTime.now().plusMinutes(baseWaitMinutes));

        Orders savedOrder = ordersRepository.save(order);
        OrdersDto responseDto = Ordersmapper.mapToOrdersDto(savedOrder);
        
        // Broadcast to shop
        messagingTemplate.convertAndSend("/topic/shop/" + shop.getShop_id(), responseDto);
        
        return responseDto;
    }

    @Override
    public OrdersDto getOrders(UUID order_id) {
        Orders orders = ordersRepository.findById(order_id)
                .orElseThrow(()->new ResourceNotFoundException("No Order exists with this Id"+order_id));
        OrdersDto dto = Ordersmapper.mapToOrdersDto(orders);
        enrichOrderDto(dto, orders);
        return dto;
    }

    @Override
    public List<OrdersDto> getAllOrders() {
        List<Orders> orders = ordersRepository.findAll();
        return orders.stream().map(order -> {
            OrdersDto dto = Ordersmapper.mapToOrdersDto(order);
            enrichOrderDto(dto, order);
            return dto;
        }).toList();
    }

    @Override
    public List<OrdersDto> getOrdersByStudent(UUID studentId) {
        List<Orders> orders = ordersRepository.findOrdersByStudentId(studentId);
        return orders.stream().map(order -> {
            OrdersDto dto = Ordersmapper.mapToOrdersDto(order);
            enrichOrderDto(dto, order);
            return dto;
        }).toList();
    }

    @Override
    public List<OrdersDto> getOrdersByShop(UUID shopId) {
        List<Orders> orders = ordersRepository.findOrdersByShopId(shopId);
        return orders.stream().map(order -> {
            OrdersDto dto = Ordersmapper.mapToOrdersDto(order);
            enrichOrderDto(dto, order);
            return dto;
        }).toList();
    }

    @Override
    public OrdersDto updateOrders(UUID order_id, OrdersDto updateOrders) {
        Orders orders=ordersRepository.findById(order_id).orElseThrow(
                ()->   new ResourceNotFoundException("Order does not exist with "+ order_id)
        );

        if (updateOrders.getStudent_id() != null) {
            Users student = usersRepository.findById(updateOrders.getStudent_id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Student not found with id: " + updateOrders.getStudent_id()));
            orders.setStudent_id(student);
        }
        
        if (updateOrders.getEstimated_ready_time() != null)
            orders.setEstimated_ready_time(updateOrders.getEstimated_ready_time());
        if (updateOrders.getPriority() != null)
            orders.setPriority(updateOrders.getPriority());
        if (updateOrders.getSubmitted_at() != null)
            orders.setSubmitted_at(updateOrders.getSubmitted_at());
        if (updateOrders.getReady_at() != null)
            orders.setReady_at(updateOrders.getReady_at());
        if (updateOrders.getCollected_at() != null)
            orders.setCollected_at(updateOrders.getCollected_at());
        if (updateOrders.getNotified() != null) {
            orders.setNotified(updateOrders.getNotified());
        }

        // Check if status changed
        String oldStatus = orders.getStatus() != null ? orders.getStatus().toString() : "";
        String newStatus = updateOrders.getStatus() != null ? updateOrders.getStatus().toString() : oldStatus;

        if (updateOrders.getStatus() != null)
            orders.setStatus(updateOrders.getStatus());

        Orders savedOrder = ordersRepository.save(orders);

        // Generate notification if status actually changed to something meaningful for the student
        if (!oldStatus.equals(newStatus)) {
            String title = "Order Update";
            String message = "Your order status changed to " + newStatus;
            String type = "shop_update";

            if ("Printing".equals(newStatus)) {
                title = "Printing Started";
                message = "The vendor has started printing your order.";
                type = "printing_started";
            } else if ("Ready".equals(newStatus)) {
                title = "Order Ready!";
                message = "Your print order is ready for pickup.";
                type = "pickup_ready";
            } else if ("Cancelled".equals(newStatus)) {
                title = "Order Cancelled";
                message = "Your order was cancelled by the vendor.";
                type = "shop_update";
            }
            
            // Only notify if student is present
            if (orders.getStudent_id() != null) {
                notificationsService.createNotification(orders.getStudent_id().getUser_id(), title, message, type);
                
                String pushToken = orders.getStudent_id().getExpo_push_token();
                if (pushToken != null && !pushToken.isEmpty()) {
                    java.util.Map<String, Object> data = new java.util.HashMap<>();
                    data.put("orderId", orders.getOrder_id().toString());
                    data.put("status", newStatus);
                    expoPushService.sendPushNotification(pushToken, title, message, data);
                }
            }
        }

        OrdersDto responseDto = Ordersmapper.mapToOrdersDto(savedOrder);
        
        // Broadcast updates to shop and student (After Commit)
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (orders.getShop() != null) {
                    messagingTemplate.convertAndSend("/topic/shop/" + orders.getShop().getShop_id(), responseDto);
                }
                if (orders.getStudent_id() != null) {
                    messagingTemplate.convertAndSend("/topic/student/" + orders.getStudent_id().getUser_id(), responseDto);
                }
            }
        });

        return responseDto;
    }

    @Override
    @Transactional
    public void deleteOrders(UUID order_id) {
        Orders order = ordersRepository.findById(order_id)
                .orElseThrow(() -> new ResourceNotFoundException("No order exists with id: " + order_id));

        paymentRepository.deleteByOrder(order);
        printSettingsRepository.deleteByOrder(order);
        filesRepository.deleteByOrder(order);
        ordersRepository.delete(order);
    }

    private void enrichOrderDto(OrdersDto dto, Orders order) {
        if (order.getShop() != null) {
            dto.setShop_name(order.getShop().getShop_name());
            dto.setShop_location(order.getShop().getLocation());
        }

        List<com.group108.printease.entities.Payments> payments = paymentRepository.findByOrder(order);
        if (!payments.isEmpty()) {
            dto.setPayment_amount(payments.get(0).getAmount());
        }

        List<com.group108.printease.entities.Files> files = filesRepository.findByOrder(order);
        List<com.group108.printease.entities.Print_Settings> allSettings = printSettingsRepository.findByOrder(order);
        List<OrderItemDto> items = new ArrayList<>();

        for (com.group108.printease.entities.Files file : files) {
            OrderItemDto item = new OrderItemDto();
            item.setFile_id(file.getFile_id());
            item.setDocument_name(file.getFile_name());
            item.setFile_type(file.getFile_type());
            item.setPage_count(file.getPage_count());
            
            // Find settings linked to this file
            com.group108.printease.entities.Print_Settings matchingSetting = allSettings.stream()
                .filter(s -> s.getFile_id() != null && s.getFile_id().getFile_id().equals(file.getFile_id()))
                .findFirst()
                .orElse(null);
                
            // Removed fallback for ghost files so they strictly remain orphaned.

            if (matchingSetting != null) {
                item.setSetting_id(matchingSetting.getSetting_id());
                item.setCopies(matchingSetting.getCopies());
                item.setPage_range(matchingSetting.getPage_range());
                if (matchingSetting.getColor_mode() != null) item.setColor_mode(matchingSetting.getColor_mode().name());
                if (matchingSetting.getSided() != null) item.setSided(matchingSetting.getSided().name());
                if (matchingSetting.getRequires_binding() != null) item.setRequires_binding(matchingSetting.getRequires_binding());
            }
            
            items.add(item);
        }
        
        dto.setItems(items);
    }
}