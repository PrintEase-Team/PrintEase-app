package com.group108.printease.controller;

import com.group108.printease.dto.OrdersDto;
import com.group108.printease.service.OrdersService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.group108.printease.dto.OrderDetailsResponseDto;
import com.group108.printease.entities.Orders;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.repositories.FilesRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import com.group108.printease.mapper.PrintSettingsmapper;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrdersController {
    private final OrdersService ordersService;
    private final OrdersRepository ordersRepository;
    private final UsersRepository usersRepository;
    private final FilesRepository filesRepository;
    private final PrintSettingsRepository printSettingsRepository;

    @PostMapping
    public ResponseEntity<OrdersDto> createOrders(@RequestBody OrdersDto ordersDto){
        OrdersDto savedOrder = ordersService.createOrders(ordersDto);
        return new ResponseEntity<>(savedOrder, HttpStatus.CREATED);
    }

    //Build Get Orders REST API
    @GetMapping("{id}")
    public ResponseEntity<OrdersDto> getOrders(@PathVariable("id") UUID order_id){
        OrdersDto ordersDto=ordersService.getOrders(order_id);
        return ResponseEntity.ok(ordersDto);
    }

    @GetMapping("/{id}/full")
    public ResponseEntity<OrderDetailsResponseDto> getFullOrderDetails(@PathVariable("id") UUID id) {
        Orders order = ordersRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        
        OrderDetailsResponseDto response = new OrderDetailsResponseDto();
        response.setOrder(order);
        response.setStudent(order.getStudent_id());
        response.setFiles(filesRepository.findByOrder(order));
        response.setPrintSettings(printSettingsRepository.findByOrder(order).stream()
            .map(PrintSettingsmapper::mapToPrintSettingsDto)
            .toList());
        
        return ResponseEntity.ok(response);
    }


    //REST API to get all orders
    @GetMapping
    public ResponseEntity<List<OrdersDto>> getAllOrders(){
        List<OrdersDto> orders = ordersService.getAllOrders().stream()
                .filter(o -> o.getStatus() != Orders.order_status.Unpaid)
                .toList();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<OrdersDto>> getOrdersByStudent(@PathVariable("studentId") UUID studentId) {
        List<OrdersDto> orders = ordersService.getOrdersByStudent(studentId).stream()
                .filter(o -> o.getStatus() != Orders.order_status.Unpaid)
                .toList();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<OrdersDto>> getOrdersByShop(@PathVariable("shopId") UUID shopId) {
        List<OrdersDto> orders = ordersService.getOrdersByShop(shopId).stream()
                .filter(o -> o.getStatus() != Orders.order_status.Unpaid)
                .toList();
        return ResponseEntity.ok(orders);
    }

    //REST API to update all orders
    @PutMapping("{id}")
    public ResponseEntity<OrdersDto> updateOrders(@PathVariable("id") UUID order_id, @RequestBody OrdersDto ordersDto){
      OrdersDto orders =ordersService.updateOrders(order_id, ordersDto);
      return ResponseEntity.ok(orders);
    }

    //REST API TO DELETE AN ORDER
    @DeleteMapping("{id}")
    public ResponseEntity<String> deleteOrders(@PathVariable("id") UUID order_id){
        ordersService.deleteOrders(order_id);
        return ResponseEntity.ok("Order deleted Successfully");
    }
}
