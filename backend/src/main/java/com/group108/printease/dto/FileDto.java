package com.group108.printease.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class FileDto {
    private UUID file_id;
    private UUID order_id;
    private UUID uploaded_by;
    private String file_name;
    private String file_type;
    private Integer file_size_kb;
    private String storage_url;
    private Integer page_count;
    private LocalDateTime uploaded_at;
    private Boolean is_deleted;
    private LocalDateTime deleted_at;
}