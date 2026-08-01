package com.group108.printease.service.impl;

import com.group108.printease.dto.PrintSettingsDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Print_Settings;
import com.group108.printease.entities.Print_Settings.settings_side;
import com.group108.printease.entities.Files;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.PrintSettingsmapper;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import com.group108.printease.repositories.FilesRepository;
import com.group108.printease.service.PrintSettingsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.TreeSet;

@Service
@AllArgsConstructor
public class PrintSettingsServiceimpl implements PrintSettingsService {
    private final PrintSettingsRepository printSettingsRepository;
    private final OrdersRepository ordersRepository;
    private final FilesRepository filesRepository;

    private Set<Integer> parsePageRange(String pageRangeStr, int totalPages) {
        Set<Integer> pages = new TreeSet<>();
        if (pageRangeStr == null || pageRangeStr.equalsIgnoreCase("All") || pageRangeStr.trim().isEmpty()) {
            for (int i = 1; i <= totalPages; i++) {
                pages.add(i);
            }
            return pages;
        }
        String[] parts = pageRangeStr.split(",");
        for (String part : parts) {
            part = part.trim();
            if (part.contains("-")) {
                String[] range = part.split("-");
                if (range.length == 2) {
                    try {
                        int start = Integer.parseInt(range[0].trim());
                        int end = Integer.parseInt(range[1].trim());
                        for (int i = start; i <= end; i++) {
                            if (i >= 1 && i <= totalPages) {
                                pages.add(i);
                            }
                        }
                    } catch (NumberFormatException e) { }
                }
            } else {
                try {
                    int page = Integer.parseInt(part);
                    if (page >= 1 && page <= totalPages) {
                        pages.add(page);
                    }
                } catch (NumberFormatException e) { }
            }
        }
        if (pages.isEmpty()) {
            for (int i = 1; i <= totalPages; i++) {
                pages.add(i);
            }
        }
        return pages;
    }

    @Override
    public PrintSettingsDto createprintsettings(PrintSettingsDto printSettingsDto) {
        Orders order = ordersRepository.findById(printSettingsDto.getOrder_id())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Order not found with id: " + printSettingsDto.getOrder_id()));

        Print_Settings printSettings = null;

        if (printSettingsDto.getFile_id() != null) {
            Files file = filesRepository.findById(printSettingsDto.getFile_id())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "File not found with id: " + printSettingsDto.getFile_id()));
            
            // Check if settings already exist for this file
            java.util.List<Print_Settings> existingSettings = printSettingsRepository.findByFile(file);
            if (!existingSettings.isEmpty()) {
                printSettings = existingSettings.get(0);
                // Update properties
                printSettings.setCopies(printSettingsDto.getCopies());
                printSettings.setColor_mode(printSettingsDto.getColor_mode());
                printSettings.setPage_range(printSettingsDto.getPage_range());
                printSettings.setSided(printSettingsDto.getSided());
                printSettings.setPaper_size(printSettingsDto.getPaper_size());
                printSettings.setOrientation(printSettingsDto.getOrientation());
                printSettings.setRequires_binding(printSettingsDto.getRequires_binding());
                printSettings.setRequires_lamination(printSettingsDto.getRequires_lamination());
                printSettings.setTotal_cost(printSettingsDto.getTotal_cost());
            } else {
                printSettings = PrintSettingsmapper.mapToPrint_Setting(printSettingsDto, order);
                printSettings.setFile_id(file);
            }
        } else {
            printSettings = PrintSettingsmapper.mapToPrint_Setting(printSettingsDto, order);
        }

        Print_Settings savedPrintSettings = printSettingsRepository.save(printSettings);
        
        // Calculate dynamic queue time based on active shop backlog
        calculateAndSetDynamicWaitTime(order, printSettingsDto);
        
        return PrintSettingsmapper.mapToPrintSettingsDto(savedPrintSettings);
    }

    private void calculateAndSetDynamicWaitTime(Orders currentOrder, PrintSettingsDto currentSettings) {
        if (currentOrder.getShop() == null) return;
        UUID shopId = currentOrder.getShop().getShop_id();
        
        // 1. Fetch active orders for this shop
        List<Orders> activeOrders = ordersRepository.findActiveOrdersByShopId(shopId);
        
        int printingTimeMins = 0;
        int handlingTimeMins = 0;
        
        // 2. Sum up wait times for active orders
        for (Orders activeOrder : activeOrders) {
            List<Files> orderFiles = filesRepository.findByOrder(activeOrder);
            List<Print_Settings> orderSettings = printSettingsRepository.findByOrder(activeOrder);
            
            if (orderFiles != null && !orderFiles.isEmpty() && orderSettings != null && !orderSettings.isEmpty()) {
                Files file = orderFiles.get(0);
                Print_Settings settings = orderSettings.get(0);
                
                int totalFilePages = file.getPage_count() != null ? file.getPage_count() : 1;
                int actualPagesToPrint = parsePageRange(settings.getPage_range(), totalFilePages).size();
                int copies = settings.getCopies() != null ? settings.getCopies() : 1;
                
                int totalPrintedSides = actualPagesToPrint * copies;
                int printerSpeedPpm = (settings.getSided() != null && settings.getSided() == settings_side.Double_sided) ? 15 : 30;
                
                printingTimeMins += (int) Math.ceil((double) totalPrintedSides / printerSpeedPpm);
                
                // Only add handling time if the order is still Pending
                if (activeOrder.getStatus() == Orders.order_status.Pending) {
                    handlingTimeMins += 1;
                }
            }
        }
        
        // 3. Current order processing
        int currentPrintingTime = 0;
        List<Files> currentFiles = filesRepository.findByOrder(currentOrder);
        if (currentFiles != null && !currentFiles.isEmpty()) {
            Files file = currentFiles.get(0);
            int totalFilePages = file.getPage_count() != null ? file.getPage_count() : 1;
            int actualPagesToPrint = parsePageRange(currentSettings.getPage_range(), totalFilePages).size();
            int copies = currentSettings.getCopies() != null ? currentSettings.getCopies() : 1;
            
            int totalPrintedSides = actualPagesToPrint * copies;
            int printerSpeedPpm = (currentSettings.getSided() != null && currentSettings.getSided() == settings_side.Double_sided) ? 15 : 30;
            currentPrintingTime = (int) Math.ceil((double) totalPrintedSides / printerSpeedPpm);
        }
        
        // 4. Calculate total wait time
        handlingTimeMins += 1; // 1 min handling for the current order itself
        int totalWaitMins = printingTimeMins + currentPrintingTime + handlingTimeMins;
        
        // Ensure priority orders get a slightly better baseline if they bypass standard handling
        if (currentOrder.getPriority() != null && currentOrder.getPriority() > 0) {
            totalWaitMins = Math.max(2, totalWaitMins / 2); // priority cut
        }
        
        currentOrder.setEstimated_ready_time(java.time.LocalDateTime.now().plusMinutes(totalWaitMins));
        ordersRepository.save(currentOrder);
    }

    @Override
    public PrintSettingsDto getprintsettings(UUID setting_id) {
        Print_Settings printSettings =printSettingsRepository.findById(setting_id)
                .orElseThrow(()-> new ResourceNotFoundException("No Print Settings exists with this Id"+setting_id));
        return PrintSettingsmapper.mapToPrintSettingsDto(printSettings);
    }

    @Override
    public PrintSettingsDto getPrintSettingsByFile(UUID file_id) {
        Files file = filesRepository.findById(file_id)
                .orElseThrow(() -> new EntityNotFoundException("File not found with id: " + file_id));
        
        java.util.List<Print_Settings> existingSettings = printSettingsRepository.findByFile(file);
        if (existingSettings.isEmpty()) {
            throw new ResourceNotFoundException("No Print Settings exist for file id " + file_id);
        }
        return PrintSettingsmapper.mapToPrintSettingsDto(existingSettings.get(0));
    }

    @Override
    public List<PrintSettingsDto> getAllPrintingSettings() {
        List<Print_Settings> printSettings =printSettingsRepository.findAll();
        return printSettings.stream().map(PrintSettingsmapper::mapToPrintSettingsDto)
                .toList();
    }

    @Override
    public PrintSettingsDto updatePrintSettings(UUID settings_id, PrintSettingsDto updatePrintSetting) {
      Print_Settings  printSettings =printSettingsRepository.findById(settings_id).orElseThrow(
                ()-> new ResourceNotFoundException("Print Settings does not exist with "+settings_id)
        );


        if (updatePrintSetting.getOrder_id() != null) {
            Orders order = ordersRepository.findById(updatePrintSetting.getOrder_id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Order not found with id: " + updatePrintSetting.getOrder_id()));
            printSettings.setOrder_id(order);
        }
        if (updatePrintSetting.getCopies() != null)
            printSettings.setCopies(updatePrintSetting.getCopies());
        if (updatePrintSetting.getColor_mode() != null)
            printSettings.setColor_mode(updatePrintSetting.getColor_mode());
        if (updatePrintSetting.getSided() != null)
            printSettings.setSided(updatePrintSetting.getSided());
        if (updatePrintSetting.getPage_range() != null)
            printSettings.setPage_range(updatePrintSetting.getPage_range());



      Print_Settings updatedPrintSettings = printSettingsRepository.save(printSettings);
        return PrintSettingsmapper.mapToPrintSettingsDto(updatedPrintSettings);
    }

    @Override
    public void deletePrintSettings(UUID settings_id) {
        Print_Settings print_settings = printSettingsRepository.findById(settings_id)
                .orElseThrow(
                        ()-> new ResourceNotFoundException("Print Settings does not exist with settings id "+ settings_id)
                );
        printSettingsRepository.delete(print_settings);
    }
}