package com.group108.printease.service.impl;

import com.group108.printease.dto.FileDto;
import com.group108.printease.entities.Files;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Users;
import com.group108.printease.exception.ResourceNotFoundException;
import com.group108.printease.mapper.Filesmapper;
import com.group108.printease.repositories.FilesRepository;
import com.group108.printease.repositories.OrdersRepository;
import com.group108.printease.repositories.PrintSettingsRepository;
import com.group108.printease.repositories.UsersRepository;
import com.group108.printease.service.FileService;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;


import java.util.List;
import java.util.UUID;




@Service
@AllArgsConstructor
public class FileServiceimpl implements FileService {
    private final FilesRepository filesRepository;
    private final OrdersRepository ordersRepository;
    private final UsersRepository usersRepository;
    private final PrintSettingsRepository printSettingsRepository;

    @Override
    public FileDto uploadFile(UUID orderId, UUID uploadedBy, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Order not found with id: " + orderId));

        Users user = usersRepository.findById(uploadedBy)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User not found with id: " + uploadedBy));

        java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads").toAbsolutePath().normalize();
        if (!java.nio.file.Files.exists(uploadPath)) {
            java.nio.file.Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        java.nio.file.Path filePath = uploadPath.resolve(fileName);
        file.transferTo(filePath.toFile());

        Files fileEntity = new Files();
        fileEntity.setOrder_id(order);
        fileEntity.setUploaded_by(user);
        fileEntity.setFile_name(file.getOriginalFilename());
        fileEntity.setFile_type(file.getContentType());
        fileEntity.setFile_size_kb((int) (file.getSize() / 1024));
        fileEntity.setStorage_url(filePath.toString());
        int pageCount = 1;
        if (file.getContentType() != null && file.getContentType().equalsIgnoreCase("application/pdf")) {
            try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
                pageCount = document.getNumberOfPages();
            } catch (Exception e) {
                System.out.println("Error parsing PDF: " + e.getMessage());
            }
        }
        
        fileEntity.setPage_count(pageCount);
        fileEntity.set_deleted(false);

        Files savedFile = filesRepository.save(fileEntity);

        // Link any unlinked print settings for this order to the uploaded file
        List<com.group108.printease.entities.Print_Settings> settings = printSettingsRepository.findByOrder(order);
        for (com.group108.printease.entities.Print_Settings s : settings) {
            if (s.getFile_id() == null) {
                s.setFile_id(savedFile);
                printSettingsRepository.save(s);
            }
        }

        return Filesmapper.mapToFileDto(savedFile);
    }

    @Override
    public FileDto getFile(UUID file_id) {
        Files files = filesRepository.findById(file_id)
                .orElseThrow(() -> new ResourceNotFoundException("No file exist with this Id" + file_id));
        return Filesmapper.mapToFileDto(files);
    }

    @Override
    public List<FileDto> getAllFiles() {
        List<Files> files = filesRepository.findAll();
        return files.stream().map(Filesmapper::mapToFileDto)
                .toList();
    }

    @Override
    public FileDto updateFile(UUID file_id, FileDto updateFile) {
        Files files = filesRepository.findById(file_id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("No file exists with id: " + file_id)
                );

        if (updateFile.getOrder_id() != null) {
            Orders order = ordersRepository.findById(updateFile.getOrder_id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Order not found with id: " + updateFile.getOrder_id()));
            files.setOrder_id(order);
        }

        if (updateFile.getUploaded_by() != null) {
            Users uploadedBy = usersRepository.findById(updateFile.getUploaded_by())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with id: " + updateFile.getUploaded_by()));
            files.setUploaded_by(uploadedBy);
        }

        if (updateFile.getFile_name() != null)
            files.setFile_name(updateFile.getFile_name());
        if (updateFile.getFile_size_kb() != null)
            files.setFile_size_kb(updateFile.getFile_size_kb());
        if (updateFile.getStorage_url() != null)
            files.setStorage_url(updateFile.getStorage_url());
        if (updateFile.getPage_count() != null)
            files.setPage_count(updateFile.getPage_count());
        if (updateFile.getFile_type() != null)
            files.setFile_type(updateFile.getFile_type());
        if (updateFile.getIs_deleted() != null)
            files.set_deleted(updateFile.getIs_deleted());
        if (updateFile.getDeleted_at() != null)
            files.setDeleted_at(updateFile.getDeleted_at());
        if(updateFile.getIs_deleted() !=null)
            files.set_deleted(files.is_deleted());

        Files updatedFiles = filesRepository.save(files);
        return Filesmapper.mapToFileDto(updatedFiles);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteFile(UUID file_id) {
        Files files = filesRepository.findById(file_id)
                .orElseThrow(
                        ()-> new ResourceNotFoundException("No file exits with file id"+ file_id)
                );
        printSettingsRepository.deleteByFile(files);
        filesRepository.delete(files);

    }
}

