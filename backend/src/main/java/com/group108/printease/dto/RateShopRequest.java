package com.group108.printease.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class RateShopRequest {
    private UUID orderId;
    private Integer score;
}
