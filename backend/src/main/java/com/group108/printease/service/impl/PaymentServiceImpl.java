package com.group108.printease.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.web.client.RestTemplate;

import com.group108.printease.dto.PaymentDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Payments;
import com.group108.printease.entities.Print_Settings;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.PaymentMapper;
import com.group108.printease.repositories.FilesRepository;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.PaymentRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import com.group108.printease.service.NotificationsService;
import com.group108.printease.service.PaymentService;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final OrdersRepository ordersRepository;
    private final PrintSettingsRepository printSettingsRepository;
    private final NotificationsService notificationsService;
    private final FilesRepository filesRepository;
    private final RestTemplate restTemplate;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Value("${paystack.secret-key}")
    private String paystackSecretKey;

    public PaymentServiceImpl(PaymentRepository paymentRepository, OrdersRepository ordersRepository,
            PrintSettingsRepository printSettingsRepository, NotificationsService notificationsService,
            FilesRepository filesRepository,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.paymentRepository = paymentRepository;
        this.ordersRepository = ordersRepository;
        this.printSettingsRepository = printSettingsRepository;
        this.notificationsService = notificationsService;
        this.filesRepository = filesRepository;
        this.restTemplate = new RestTemplate();
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public PaymentDto createPayment(PaymentDto paymentDto) {
        Orders order = ordersRepository.findById(paymentDto.getOrder_id())
                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + paymentDto.getOrder_id()));

        // Calculate price if not provided
        BigDecimal amount = paymentDto.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            List<Print_Settings> settings = printSettingsRepository.findByOrder(order);
            double calculatedPrice = 0.0;
            for (Print_Settings setting : settings) {
                double basePrice = 0.50; // Base price per page
                if (setting.getColor_mode() == Print_Settings.color_settings.Colored) {
                    basePrice += 0.50;
                }
                calculatedPrice += basePrice * setting.getCopies();
            }
            if (order.getPriority() != null && order.getPriority() > 0) {
                calculatedPrice += 2.00; // Priority fee
            }
            amount = BigDecimal.valueOf(calculatedPrice);
        }
        paymentDto.setAmount(amount);

        Payments payment = PaymentMapper.mapToPayment(paymentDto, order);
        Payments savedPayment = paymentRepository.save(payment);
        return PaymentMapper.mapToPaymentDto(savedPayment);
    }

    @Override
    public PaymentDto confirmPayment(UUID paymentId, String reference) {
        Payments payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        // Call Paystack API to verify
        String url = "https://api.paystack.co/transaction/verify/" + reference;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + paystackSecretKey);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && Boolean.TRUE.equals(body.get("status"))) {
                Map<String, Object> data = (Map<String, Object>) body.get("data");
                if ("success".equals(data.get("status"))) {
                    payment.setStatus(Payments.payment_status.Completed);
                    payment.setReference(reference);
                    payment.setPayment_method("MobileMoney");

                    // Mark order as Pending
                    Orders order = payment.getOrder_id();
                    order.setStatus(Orders.order_status.Pending);
                    ordersRepository.save(order);

                    // Broadcast update to shop so it appears on vendor dashboard (After Commit)
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            if (order.getShop() != null) {
                                messagingTemplate.convertAndSend("/topic/shop/" + order.getShop().getShop_id(),
                                        com.group108.printease.mapper.Ordersmapper.mapToOrdersDto(order));
                            }
                            if (order.getStudent_id() != null) {
                                messagingTemplate.convertAndSend("/topic/student/" + order.getStudent_id().getUserId(),
                                        com.group108.printease.mapper.Ordersmapper.mapToOrdersDto(order));
                            }
                        }
                    });

                    // PDF Slicing removed. The original file is preserved for vendor.
                    // Notify user
                    if (order.getStudent_id() != null) {
                        notificationsService.createNotification(
                                order.getStudent_id().getUserId(),
                                "Payment Successful",
                                "Your payment of GHS " + payment.getAmount() + " was successful.",
                                "payment_success");
                    }

                    Payments updatedPayment = paymentRepository.save(payment);
                    return PaymentMapper.mapToPaymentDto(updatedPayment);
                }
            }
            throw new RuntimeException("Paystack verification failed: " + body);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("Paystack verification API returned an error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            throw new RuntimeException("Paystack verification failed: Transaction not found or invalid reference. Please ensure your frontend public key and backend secret key belong to the same Paystack account. Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException("Error verifying payment with Paystack: " + e.getMessage(), e);
        }
    }
}
