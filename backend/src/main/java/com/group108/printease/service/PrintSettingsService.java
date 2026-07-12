package com.group108.printease.service;

import com.group108.printease.dto.PrintSettingsDto;

import java.util.List;
import java.util.UUID;

public interface PrintSettingsService {
    PrintSettingsDto createprintsettings(PrintSettingsDto printSettingsDto);

    PrintSettingsDto getprintsettings(UUID setting_id);
    List<PrintSettingsDto> getAllPrintingSettings();
    PrintSettingsDto updatePrintSettings(UUID settings_id, PrintSettingsDto updatePrintSetting);
    void deletePrintSettings(UUID settings_id);
}
