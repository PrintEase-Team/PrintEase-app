package com.group108.printease.dto;

import com.group108.printease.entities.Files;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Print_Settings;
import com.group108.printease.entities.Users;
import lombok.Data;

import java.util.List;

@Data
public class OrderDetailsResponseDto {
    private Orders order;
    private Users student;
    private List<Files> files;
    private List<Print_Settings> printSettings;
}
