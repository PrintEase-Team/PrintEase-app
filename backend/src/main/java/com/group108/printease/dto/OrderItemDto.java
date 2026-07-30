package com.group108.printease.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemDto {
    private UUID file_id;
    private String document_name;
    private Integer page_count;
    private String file_type;
    
    private UUID setting_id;
    private Integer copies;
    private String color_mode;
    private String sided;
    private String page_range;
    private Boolean requires_binding;
}
