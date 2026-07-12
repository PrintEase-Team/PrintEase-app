package com.group108.printease.service;

import com.group108.printease.dto.PaymentDto;
import java.util.UUID;

public interface PaymentService {
    PaymentDto createPayment(PaymentDto paymentDto);
    PaymentDto confirmPayment(UUID paymentId, String reference);
}
