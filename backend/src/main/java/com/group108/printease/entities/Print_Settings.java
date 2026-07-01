package com.group108.printease.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "print_settings_tbl")
@Getter
@Setter
@NoArgsConstructor
public class Print_Settings {


    public enum color_settings {
        Black_and_White,
        Colored
    }
    public enum settings_side {
        Double_sided,
        Single_sided
    }

    @Id
    @UuidGenerator
    @Column(name = "setting_id")
    private UUID setting_id;

    @ManyToOne
    @JoinColumn(
            name = "order_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "print_settings_order_id_fk")
    )
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Orders order_id;

    @Column(name = "copies", nullable = false)
    private Integer copies;

    @Enumerated(EnumType.STRING)

    @Column(name = "color_mode")
    private color_settings color_mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "sided")

    private settings_side sided;

    @Column(name = "page_range")
    private String page_range;

    @Column(name = "paper_size")
    private String paper_size;

    @Column(name = "orientation")
    private String orientation;

    @Column(name = "requires_binding")
    private Boolean requires_binding = false;

    @Column(name = "requires_lamination")
    private Boolean requires_lamination = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime created_at;
}