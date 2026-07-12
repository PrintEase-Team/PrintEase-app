package com.group108.printease.service.impl;

import com.group108.printease.dto.PrintShopsDto;
import com.group108.printease.entities.PrintShops;
import com.group108.printease.entities.Users;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.PrintShopsMapper;
import com.group108.printease.repositories.PrintShopsRepository;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.service.PrintShopsService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class PrintShopsServiceimpl implements PrintShopsService {

    private final PrintShopsRepository printShopsRepository;
    private final UsersRepository usersRepository;
    private final com.group108.printease.repositories.OrdersRepository ordersRepository;

    @Override
    public PrintShopsDto getShopByVendorId(UUID vendorId) {
        PrintShops shop = printShopsRepository.findByVendorId(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("No active shop found for vendor id: " + vendorId));
        return PrintShopsMapper.mapToPrintShopsDto(shop);
    }

    @Override
    public PrintShopsDto getShopById(UUID shopId) {
        PrintShops shop = printShopsRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));
        return PrintShopsMapper.mapToPrintShopsDto(shop);
    }

    @Override
    public List<PrintShopsDto> getAllActiveShops() {
        return printShopsRepository.findAll().stream()
                .filter(PrintShops::getIs_active)
                .map(PrintShopsMapper::mapToPrintShopsDto)
                .collect(Collectors.toList());
    }

    @Override
    public PrintShopsDto updateShop(UUID vendorId, PrintShopsDto dto) {
        Optional<PrintShops> optionalShop = printShopsRepository.findByVendorId(vendorId);
        PrintShops shop;

        if (optionalShop.isPresent()) {
            shop = optionalShop.get();
        } else {
            Users vendor = usersRepository.findById(vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + vendorId));
            shop = new PrintShops();
            shop.setVendor(vendor);
        }

        if (dto.getShop_name() != null) shop.setShop_name(dto.getShop_name());
        if (dto.getLocation() != null) shop.setLocation(dto.getLocation());
        if (dto.getPhone_number() != null) shop.setPhone_number(dto.getPhone_number());
        if (dto.getOperating_hours() != null) shop.setOperating_hours(dto.getOperating_hours());
        if (dto.getIs_active() != null) shop.setIs_active(dto.getIs_active());
        if (dto.getProfile_picture_url() != null) shop.setProfile_picture_url(dto.getProfile_picture_url());
        if (dto.getBanner_picture_url() != null) shop.setBanner_picture_url(dto.getBanner_picture_url());
        if (dto.getLatitude() != null) shop.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) shop.setLongitude(dto.getLongitude());
        if (dto.getAdditional_location_details() != null) shop.setAdditional_location_details(dto.getAdditional_location_details());
        if (dto.getServices_offered() != null) shop.setServices_offered(dto.getServices_offered());
        if (dto.getEstablished_year() != null) shop.setEstablished_year(dto.getEstablished_year());
        if (dto.getPrice_a4_bw() != null) shop.setPrice_a4_bw(dto.getPrice_a4_bw());
        if (dto.getPrice_a4_color() != null) shop.setPrice_a4_color(dto.getPrice_a4_color());
        if (dto.getPrice_a3_bw() != null) shop.setPrice_a3_bw(dto.getPrice_a3_bw());
        if (dto.getPrice_a3_color() != null) shop.setPrice_a3_color(dto.getPrice_a3_color());
        if (dto.getPrice_letter_bw() != null) shop.setPrice_letter_bw(dto.getPrice_letter_bw());
        if (dto.getPrice_letter_color() != null) shop.setPrice_letter_color(dto.getPrice_letter_color());
        if (dto.getSupports_a4() != null) shop.setSupports_a4(dto.getSupports_a4());
        if (dto.getSupports_a3() != null) shop.setSupports_a3(dto.getSupports_a3());
        if (dto.getSupports_letter() != null) shop.setSupports_letter(dto.getSupports_letter());
        if (dto.getSupports_binding() != null) shop.setSupports_binding(dto.getSupports_binding());
        if (dto.getBinding_pricing() != null) shop.setBinding_pricing(dto.getBinding_pricing());
        if (dto.getSupports_lamination() != null) shop.setSupports_lamination(dto.getSupports_lamination());
        if (dto.getPrice_lamination_a4() != null) shop.setPrice_lamination_a4(dto.getPrice_lamination_a4());
        if (dto.getPrice_lamination_a3() != null) shop.setPrice_lamination_a3(dto.getPrice_lamination_a3());
        if (dto.getPrice_lamination_letter() != null) shop.setPrice_lamination_letter(dto.getPrice_lamination_letter());

        // Default name if missing
        if (shop.getShop_name() == null) shop.setShop_name("My Print Shop");

        PrintShops savedShop = printShopsRepository.save(shop);
        return PrintShopsMapper.mapToPrintShopsDto(savedShop);
    }

    @Override
    public PrintShopsDto uploadShopImage(UUID vendorId, String imageType, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        PrintShops shop = printShopsRepository.findByVendorId(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + vendorId));

        java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads", "images").toAbsolutePath().normalize();
        if (!java.nio.file.Files.exists(uploadPath)) {
            java.nio.file.Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        java.nio.file.Path filePath = uploadPath.resolve(fileName);
        file.transferTo(filePath.toFile());

        String fileUrl = "/api/shops/images/" + fileName;

        if ("profile".equalsIgnoreCase(imageType)) {
            shop.setProfile_picture_url(fileUrl);
        } else if ("banner".equalsIgnoreCase(imageType)) {
            shop.setBanner_picture_url(fileUrl);
        }

        PrintShops savedShop = printShopsRepository.save(shop);
        return PrintShopsMapper.mapToPrintShopsDto(savedShop);
    }

    @Override
    public PrintShopsDto updateShopStatusOverride(UUID shopId, String overrideStatus) {
        PrintShops shop = printShopsRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if ("OPEN".equalsIgnoreCase(overrideStatus)) {
            shop.setStatus_override("OPEN");
            shop.setOverride_expires_at(java.time.LocalDateTime.now().plusHours(1));
        } else if ("CLOSED".equalsIgnoreCase(overrideStatus)) {
            shop.setStatus_override("CLOSED");
            java.time.LocalDateTime expiration = java.time.LocalDateTime.now().toLocalDate().plusDays(1).atStartOfDay(); // Default to midnight tonight
            try {
                String hoursJson = shop.getOperating_hours();
                if (hoursJson != null && hoursJson.contains("{")) {
                    String[] days = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
                    String today = days[java.time.LocalDate.now().getDayOfWeek().getValue() % 7];
                    
                    int dayIdx = hoursJson.indexOf("\"" + today + "\"");
                    if (dayIdx != -1) {
                        int activeIdx = hoursJson.indexOf("\"active\":true", dayIdx);
                        int nextDayIdx = hoursJson.indexOf("\"", dayIdx + today.length() + 3); // Find next day key roughly
                        
                        // If active is true and belongs to today
                        if (activeIdx != -1 && (nextDayIdx == -1 || activeIdx < nextDayIdx)) {
                            int closeIdx = hoursJson.indexOf("\"close\":\"", dayIdx);
                            if (closeIdx != -1) {
                                int startQuote = closeIdx + 9;
                                int endQuote = hoursJson.indexOf("\"", startQuote);
                                if (endQuote != -1) {
                                    String closeStr = hoursJson.substring(startQuote, endQuote);
                                    String[] parts = closeStr.split(":");
                                    int closeHour = Integer.parseInt(parts[0]);
                                    int closeMin = Integer.parseInt(parts[1]);
                                    
                                    java.time.LocalDateTime closeTime = java.time.LocalDate.now().atTime(closeHour, closeMin);
                                    
                                    if (closeHour < 6) {
                                        closeTime = closeTime.plusDays(1);
                                    } else if (closeTime.isBefore(java.time.LocalDateTime.now())) {
                                        closeTime = java.time.LocalDateTime.now();
                                    }
                                    expiration = closeTime;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.out.println("Failed to parse operating hours for expiration: " + e.getMessage());
            }
            shop.setOverride_expires_at(expiration);
        } else {
            shop.setStatus_override("NONE");
            shop.setOverride_expires_at(null);
        }

        PrintShops savedShop = printShopsRepository.save(shop);
        return PrintShopsMapper.mapToPrintShopsDto(savedShop);
    }

    @Override
    public PrintShopsDto rateShop(UUID shopId, com.group108.printease.dto.RateShopRequest request) {
        PrintShops shop = printShopsRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        com.group108.printease.entities.Orders order = ordersRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getShop().getShop_id().equals(shopId)) {
            throw new IllegalArgumentException("Order does not belong to this shop.");
        }

        if (order.getStatus() != com.group108.printease.entities.Orders.order_status.Collected) {
            throw new IllegalArgumentException("Only collected orders can be rated.");
        }

        if (order.is_rated()) {
            throw new IllegalArgumentException("This order has already been rated.");
        }

        if (request.getScore() < 1 || request.getScore() > 5) {
            throw new IllegalArgumentException("Score must be between 1 and 5.");
        }

        double oldTotal = shop.getTotal_ratings();
        double oldAvg = shop.getAverage_rating();
        double newAvg = ((oldAvg * oldTotal) + request.getScore()) / (oldTotal + 1);

        shop.setTotal_ratings(shop.getTotal_ratings() + 1);
        shop.setAverage_rating(newAvg);
        order.set_rated(true);

        ordersRepository.save(order);
        PrintShops savedShop = printShopsRepository.save(shop);

        return PrintShopsMapper.mapToPrintShopsDto(savedShop);
    }
}
