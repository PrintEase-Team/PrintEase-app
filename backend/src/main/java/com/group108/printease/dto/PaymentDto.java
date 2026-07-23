package com.group108.printease.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDto {
    private UUID payment_id;
    private UUID order_id;
    private BigDecimal amount;
    private String status;
    private String payment_method;
    private String reference;
    private LocalDateTime created_at;
}
