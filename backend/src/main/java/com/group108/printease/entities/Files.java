package com.group108.printease.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "files_tbl")
@Getter
@Setter
@NoArgsConstructor
public class Files {
    @Id
    @UuidGenerator
    @Column(name = "file_id")
    private UUID file_id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false,
            foreignKey = @ForeignKey(name = "file_order_id_fk"))
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Orders order_id;

    @ManyToOne
    @JoinColumn(name = "uploaded_by", nullable = false,
            foreignKey = @ForeignKey(name = "uploaded_by_foreign_key"))
    private Users uploaded_by;

    @Column(name = "file_name", nullable = false)
    private String file_name;

    @Column(name = "file_type")
    private String file_type;

    @Column(name = "file_size_kb")
    private Integer file_size_kb;

    @Column(name = "storage_url", nullable = false, unique = true)
    private String storage_url;

    @Column(name = "page_count")
    private Integer page_count;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploaded_at;

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private boolean is_deleted;

    @Column(name = "deleted_at")
    private LocalDateTime deleted_at;

}