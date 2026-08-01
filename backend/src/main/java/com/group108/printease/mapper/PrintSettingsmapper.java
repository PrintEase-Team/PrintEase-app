package com.group108.printease.mapper;

import com.group108.printease.dto.PrintSettingsDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Print_Settings;

public class PrintSettingsmapper {

    public static PrintSettingsDto mapToPrintSettingsDto(Print_Settings printSettings) {
        return new PrintSettingsDto(
                printSettings.getSetting_id(),
                printSettings.getOrder_id() != null ? printSettings.getOrder_id().getOrder_id() : null,
                printSettings.getFile_id() != null ? printSettings.getFile_id().getFile_id() : null,
                printSettings.getCopies(),
                printSettings.getColor_mode(),
                printSettings.getSided(),
                printSettings.getPage_range(),
                printSettings.getPaper_size(),
                printSettings.getOrientation(),
                printSettings.getRequires_binding(),
                printSettings.getRequires_lamination(),
                printSettings.getTotal_cost(),
                printSettings.getCreated_at()
        );
    }

    public static Print_Settings mapToPrint_Setting(PrintSettingsDto printSettingsDto, Orders order) {
        Print_Settings printSettings = new Print_Settings();
        printSettings.setSetting_id(printSettingsDto.getSetting_id());
        printSettings.setOrder_id(order);
        // file_id will be mapped separately in the service if needed, or we can pass Files as argument
        printSettings.setCopies(printSettingsDto.getCopies());
        printSettings.setColor_mode(printSettingsDto.getColor_mode());
        printSettings.setSided(printSettingsDto.getSided());
        printSettings.setPage_range(printSettingsDto.getPage_range());
        if (printSettingsDto.getPaper_size() != null) printSettings.setPaper_size(printSettingsDto.getPaper_size());
        if (printSettingsDto.getOrientation() != null) printSettings.setOrientation(printSettingsDto.getOrientation());
        if (printSettingsDto.getRequires_binding() != null) printSettings.setRequires_binding(printSettingsDto.getRequires_binding());
        if (printSettingsDto.getRequires_lamination() != null) printSettings.setRequires_lamination(printSettingsDto.getRequires_lamination());
        if (printSettingsDto.getTotal_cost() != null) printSettings.setTotal_cost(printSettingsDto.getTotal_cost());
        return printSettings;
    }
}