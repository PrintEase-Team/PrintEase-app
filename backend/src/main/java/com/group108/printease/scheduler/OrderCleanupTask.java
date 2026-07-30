package com.group108.printease.scheduler;

import com.group108.printease.entities.Files;
import com.group108.printease.entities.Orders;
import com.group108.printease.repositories.FilesRepository;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderCleanupTask {

    private final OrdersRepository ordersRepository;
    private final FilesRepository filesRepository;
    private final PrintSettingsRepository printSettingsRepository;

    // Runs every day at 2:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupAbandonedOrders() {
        // Find Unpaid orders that are older than 24 hours
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Orders> abandonedOrders = ordersRepository.findOrdersByStatusAndDateBefore(Orders.order_status.Unpaid, cutoff);

        for (Orders order : abandonedOrders) {
            List<Files> orderFiles = filesRepository.findByOrder(order);
            
            for (Files file : orderFiles) {
                // Delete print settings associated with the file
                printSettingsRepository.deleteByFile(file);
                
                // Delete physical file from disk
                if (file.getStorage_url() != null) {
                    try {
                        Path filePath = Paths.get(file.getStorage_url());
                        java.nio.file.Files.deleteIfExists(filePath);
                    } catch (Exception e) {
                        System.err.println("Failed to delete physical file: " + file.getStorage_url());
                    }
                }
                
                // Delete file record from DB
                filesRepository.delete(file);
            }
            
            // Delete order record from DB
            ordersRepository.delete(order);
        }
        
        if (!abandonedOrders.isEmpty()) {
            System.out.println("Cleaned up " + abandonedOrders.size() + " abandoned Unpaid orders.");
        }
    }
}
