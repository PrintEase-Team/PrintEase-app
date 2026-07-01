package com.group108.printease.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments_tbl")
@Getter
@Setter
@NoArgsConstructor
public class Payments {
    public enum payment_status {
        Pending, Completed, Failed
    }

    @Id
    @UuidGenerator
    @Column(name = "payment_id")
    private UUID payment_id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "payment_order_id_fk"))
    private Orders order_id;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)

    @Column(name = "status", nullable = false)
    private payment_status status;

    @Column(name = "payment_method")
    private String payment_method; // e.g., Card, MobileMoney

    @Column(name = "reference", unique = true)
    private String reference; // Paystack transaction reference

    @Column(name = "created_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime created_at;
}
