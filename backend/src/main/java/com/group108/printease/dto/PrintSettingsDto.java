package com.group108.printease.dto;

import com.group108.printease.entities.Print_Settings;
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
public class PrintSettingsDto {
    private UUID setting_id;
    private UUID order_id;
    private UUID file_id;
    private Integer copies;
    private Print_Settings.color_settings color_mode;
    private Print_Settings.settings_side sided;
    private String page_range;
    private String paper_size;
    private String orientation;
    private Boolean requires_binding;
    private Boolean requires_lamination;
    private Double total_cost;
    private LocalDateTime created_at;
}
