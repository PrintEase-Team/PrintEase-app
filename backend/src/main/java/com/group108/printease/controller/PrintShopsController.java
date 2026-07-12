package com.group108.printease.controller;

import com.group108.printease.dto.PrintShopsDto;
import com.group108.printease.service.PrintShopsService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import java.nio.file.Path;
import java.nio.file.Paths;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/shops")
@AllArgsConstructor
public class PrintShopsController {

    private final PrintShopsService printShopsService;

    @GetMapping
    public ResponseEntity<List<PrintShopsDto>> getAllActiveShops() {
        return ResponseEntity.ok(printShopsService.getAllActiveShops());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrintShopsDto> getShopById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(printShopsService.getShopById(id));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<PrintShopsDto> getShopByVendorId(@PathVariable("vendorId") UUID vendorId) {
        return ResponseEntity.ok(printShopsService.getShopByVendorId(vendorId));
    }

    @PutMapping("/vendor/{vendorId}")
    public ResponseEntity<PrintShopsDto> updateShop(@PathVariable("vendorId") UUID vendorId, @RequestBody PrintShopsDto dto) {
        return ResponseEntity.ok(printShopsService.updateShop(vendorId, dto));
    }

    @PutMapping("/{id}/status-override")
    public ResponseEntity<PrintShopsDto> updateShopStatusOverride(@PathVariable("id") UUID id, @RequestBody java.util.Map<String, String> payload) {
        String overrideStatus = payload.get("override");
        return ResponseEntity.ok(printShopsService.updateShopStatusOverride(id, overrideStatus));
    }

    @PostMapping("/vendor/{vendorId}/upload-image")
    public ResponseEntity<PrintShopsDto> uploadShopImage(
            @PathVariable("vendorId") UUID vendorId,
            @RequestParam("type") String imageType,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            PrintShopsDto updatedShop = printShopsService.uploadShopImage(vendorId, imageType, file);
            return ResponseEntity.ok(updatedShop);
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> serveShopImage(@PathVariable("filename") String filename) {
        try {
            Path filePath = Paths.get("uploads", "images", filename).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = java.nio.file.Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/rate")
    public ResponseEntity<PrintShopsDto> rateShop(@PathVariable("id") UUID shopId, @RequestBody com.group108.printease.dto.RateShopRequest request) {
        return ResponseEntity.ok(printShopsService.rateShop(shopId, request));
    }
}
