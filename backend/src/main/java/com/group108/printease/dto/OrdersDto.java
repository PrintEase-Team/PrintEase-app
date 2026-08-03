package com.group108.printease.dto;

import com.group108.printease.entities.Orders;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class OrdersDto {
    private UUID order_id;
    private UUID student_id;
    private UUID shop_id;
    private String pickup_code;
    private Orders.order_status status;
    private LocalDateTime estimated_ready_time;
    private Integer priority;
    private LocalDateTime submitted_at;
    private LocalDateTime ready_at;
    private LocalDateTime collected_at;
    private Boolean notified;
    private BigDecimal payment_amount;
    private List<OrderItemDto> items;
    private String student_name;
    private String student_phone;
    private String shop_name;
    private String shop_location;
    private String shop_profile_url;
    private Boolean is_rated;
}
