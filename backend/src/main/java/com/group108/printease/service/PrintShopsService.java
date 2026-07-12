package com.group108.printease.service;

import com.group108.printease.dto.PrintShopsDto;

import java.util.List;
import java.util.UUID;

public interface PrintShopsService {
    PrintShopsDto getShopByVendorId(UUID vendorId);
    PrintShopsDto getShopById(UUID shopId);
    List<PrintShopsDto> getAllActiveShops();
    PrintShopsDto updateShop(UUID vendorId, PrintShopsDto dto);
    PrintShopsDto uploadShopImage(UUID vendorId, String imageType, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException;
    PrintShopsDto updateShopStatusOverride(UUID shopId, String overrideStatus);
    PrintShopsDto rateShop(UUID shopId, com.group108.printease.dto.RateShopRequest request);
}
