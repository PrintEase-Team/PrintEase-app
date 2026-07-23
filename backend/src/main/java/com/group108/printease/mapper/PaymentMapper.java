package com.group108.printease.mapper;

import com.group108.printease.dto.PaymentDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Payments;

public class PaymentMapper {
    public static PaymentDto mapToPaymentDto(Payments payment) {
        PaymentDto dto = new PaymentDto();
        dto.setPayment_id(payment.getPayment_id());
        dto.setOrder_id(payment.getOrder_id().getOrder_id());
        dto.setAmount(payment.getAmount());
        dto.setStatus(payment.getStatus() != null ? payment.getStatus().name() : null);
        dto.setPayment_method(payment.getPayment_method());
        dto.setReference(payment.getReference());
        dto.setCreated_at(payment.getCreated_at());
        return dto;
    }

    public static Payments mapToPayment(PaymentDto dto, Orders order) {
        Payments payment = new Payments();
        payment.setOrder_id(order);
        payment.setAmount(dto.getAmount());
        payment.setPayment_method(dto.getPayment_method());
        payment.setReference(dto.getReference());
        if (dto.getStatus() != null) {
            payment.setStatus(Payments.payment_status.valueOf(dto.getStatus()));
        } else {
            payment.setStatus(Payments.payment_status.Pending);
        }
        return payment;
    }
}
