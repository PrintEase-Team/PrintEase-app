package com.group108.printease.controller;

import com.group108.printease.dto.PaymentDto;
import com.group108.printease.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentDto> createPayment(@RequestBody PaymentDto paymentDto) {
        PaymentDto savedPayment = paymentService.createPayment(paymentDto);
        return new ResponseEntity<>(savedPayment, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<PaymentDto> confirmPayment(@PathVariable("id") UUID paymentId, @RequestParam("reference") String reference) {
        PaymentDto confirmedPayment = paymentService.confirmPayment(paymentId, reference);
        return ResponseEntity.ok(confirmedPayment);
    }
}
