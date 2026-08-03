package com.group108.printease.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orders {
    public enum order_status {
        Unpaid, Pending, Printing, Ready, Collected
    }

    @Id
    @UuidGenerator
    @Column(name = "order_id")
    private UUID order_id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false,
            foreignKey = @ForeignKey(name = "student_id_foreign_key"))
    private Users student_id;

    @ManyToOne
    @JoinColumn(name = "shop_id", nullable = true,
            foreignKey = @ForeignKey(name = "orders_shop_id_fk"))
    private PrintShops shop;

    @Column(name = "pickup_code")
    private String pickup_code;

    @Enumerated(EnumType.STRING)

    @Column(name = "status")
    private order_status status;

    @Column(name = "estimated_ready_time")
    private LocalDateTime estimated_ready_time;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "submitted_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime submitted_at;

    @Column(name = "ready_at")
    private LocalDateTime ready_at;

    @Column(name = "collected_at")
    private LocalDateTime collected_at;

    @Column(name = "notified", columnDefinition = "boolean default false")
    private boolean notified;

    @Column(name = "is_rated", columnDefinition = "boolean default false")
    private boolean is_rated = false;
}