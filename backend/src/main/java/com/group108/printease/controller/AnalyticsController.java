package com.group108.printease.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        // Mock data structure to feed the vendor-web dashboard MVP
        // In a full production version, these would be aggregated via JPA projections
        
        List<Map<String, Object>> revenueData = List.of(
                Map.of("date", "May 16", "revenue", 750),
                Map.of("date", "May 17", "revenue", 900),
                Map.of("date", "May 18", "revenue", 600),
                Map.of("date", "May 19", "revenue", 1050),
                Map.of("date", "May 20", "revenue", 850),
                Map.of("date", "May 21", "revenue", 950),
                Map.of("date", "May 22", "revenue", 1250)
        );

        List<Map<String, Object>> revenueByDayData = List.of(
                Map.of("date", "May 16", "val", 650),
                Map.of("date", "May 17", "val", 740),
                Map.of("date", "May 18", "val", 520),
                Map.of("date", "May 19", "val", 830),
                Map.of("date", "May 20", "val", 1020),
                Map.of("date", "May 21", "val", 1150),
                Map.of("date", "May 22", "val", 1250)
        );

        List<Map<String, Object>> statusData = List.of(
                Map.of("name", "Pending", "value", 12, "color", "#f59e0b"),
                Map.of("name", "Printing", "value", 5, "color", "#3b82f6"),
                Map.of("name", "Ready for Pickup", "value", 7, "color", "#a855f7"),
                Map.of("name", "Completed", "value", 28, "color", "#22c55e"),
                Map.of("name", "Cancelled", "value", 6, "color", "#ef4444")
        );

        List<Map<String, Object>> paperSizeData = List.of(
                Map.of("name", "A4", "value", 145, "color", "#3b82f6"),
                Map.of("name", "A3", "value", 55, "color", "#22c55e"),
                Map.of("name", "Letter", "value", 30, "color", "#f59e0b"),
                Map.of("name", "Legal", "value", 15, "color", "#a855f7"),
                Map.of("name", "Others", "value", 11, "color", "#ef4444")
        );

        List<Map<String, Object>> servicesData = List.of(
                Map.of("name", "Black & White Printing", "orders", 124, "revenue", "GHS 780.00", "percent", 48.3, "color", "#005CE6"),
                Map.of("name", "Color Printing", "orders", 68, "revenue", "GHS 320.00", "percent", 19.8, "color", "#8b5cf6"),
                Map.of("name", "Scanning", "orders", 35, "revenue", "GHS 175.00", "percent", 10.8, "color", "#10b981"),
                Map.of("name", "Binding", "orders", 18, "revenue", "GHS 90.00", "percent", 5.6, "color", "#f59e0b"),
                Map.of("name", "Lamination", "orders", 12, "revenue", "GHS 60.00", "percent", 3.7, "color", "#ef4444")
        );

        Map<String, Object> summaryStats = Map.of(
                "totalRevenue", "GHS 1,250.00",
                "totalOrders", 68,
                "totalPrints", 256,
                "newCustomers", 22,
                "averageOrderValue", "GHS 18.38"
        );

        return ResponseEntity.ok(Map.of(
                "revenueData", revenueData,
                "revenueByDayData", revenueByDayData,
                "statusData", statusData,
                "paperSizeData", paperSizeData,
                "servicesData", servicesData,
                "summaryStats", summaryStats
        ));
    }
}
