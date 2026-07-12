package com.group108.printease.service.impl;

import com.group108.printease.dto.PrintSettingsDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Print_Settings;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.PrintSettingsmapper;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import com.group108.printease.service.PrintSettingsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class PrintSettingsServiceimpl implements PrintSettingsService {
    private final PrintSettingsRepository printSettingsRepository;
    private final OrdersRepository ordersRepository;

    @Override
    public PrintSettingsDto createprintsettings(PrintSettingsDto printSettingsDto) {
        Orders order = ordersRepository.findById(printSettingsDto.getOrder_id())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Order not found with id: " + printSettingsDto.getOrder_id()));

        Print_Settings printSettings = PrintSettingsmapper.mapToPrint_Setting(printSettingsDto, order);
        Print_Settings savedPrintSettings = printSettingsRepository.save(printSettings);
        return PrintSettingsmapper.mapToPrintSettingsDto(savedPrintSettings);
    }

    @Override
    public PrintSettingsDto getprintsettings(UUID setting_id) {
        Print_Settings printSettings =printSettingsRepository.findById(setting_id)
                .orElseThrow(()-> new ResourceNotFoundException("No Print Settings exists with this Id"+setting_id));
        return PrintSettingsmapper.mapToPrintSettingsDto(printSettings);
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