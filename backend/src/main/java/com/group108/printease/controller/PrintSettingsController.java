package com.group108.printease.controller;

import com.group108.printease.dto.PrintSettingsDto;
import com.group108.printease.service.PrintSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/printsettings")
public class PrintSettingsController {
    private final PrintSettingsService printSettingsService;

    @PostMapping
    public ResponseEntity<PrintSettingsDto> createprintsettings(@RequestBody PrintSettingsDto printSettingsDto){
        PrintSettingsDto savedPrintSettings=printSettingsService.createprintsettings(printSettingsDto);
        return new ResponseEntity<>(savedPrintSettings, HttpStatus.CREATED);
    }

    //Build Get PrintSetting REST API
    @GetMapping("{id}")
    public  ResponseEntity<PrintSettingsDto> getprintsettings(@PathVariable("id") UUID setting_id){
        PrintSettingsDto printSettingsDto= printSettingsService.getprintsettings(setting_id);
        return ResponseEntity.ok(printSettingsDto);
    }

    //REST API for all
    @GetMapping
    public ResponseEntity<List<PrintSettingsDto>> getAllPrintSettings(){
         List<PrintSettingsDto>printingSettings =printSettingsService.getAllPrintingSettings();
         return ResponseEntity.ok(printingSettings);
    }

    //REST API to update print settings
    @PutMapping("{id}")
    public ResponseEntity<PrintSettingsDto> updatePrintSettings(@PathVariable("id") UUID settings_id, @RequestBody PrintSettingsDto printSettingsDto){
      PrintSettingsDto printSettings = printSettingsService.updatePrintSettings(settings_id, printSettingsDto);
      return ResponseEntity.ok(printSettings);
    }

    //REST API FOR PRINT SETTINGS
    @DeleteMapping("{id}")
    public ResponseEntity<String> deletePrintSettings(@PathVariable("id") UUID settings_id){
        printSettingsService.deletePrintSettings(settings_id);
        return ResponseEntity.ok("Print Settings Deleted Successfully");
    }
}
