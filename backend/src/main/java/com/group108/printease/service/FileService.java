package com.group108.printease.service;

import com.group108.printease.dto.FileDto;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface FileService {
    FileDto uploadFile (UUID orderId, UUID uploadedBy, MultipartFile file) throws IOException;
    FileDto getFile(UUID file_id);
    List<FileDto> getAllFiles();
    FileDto updateFile(UUID file_id, FileDto updateFile);
    void deleteFile(UUID file_id);
}
