package com.group108.printease.controller;

import com.group108.printease.dto.FileDto;
import com.group108.printease.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;


    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<FileDto> uploadFile(
            @RequestParam("order_id") UUID orderId,
            @RequestParam("uploaded_by") UUID uploadedBy,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            FileDto savedFile = fileService.uploadFile(orderId, uploadedBy, file);
            return new ResponseEntity<>(savedFile, HttpStatus.CREATED);
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("{id}")
    public ResponseEntity<FileDto> getFile(@PathVariable("id")UUID file_id){
        FileDto fileDto = fileService.getFile(file_id);
        return ResponseEntity.ok(fileDto);
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewFile(@PathVariable("id") UUID id) {
        try {
            FileDto fileDto = fileService.getFile(id);
            Path filePath = Paths.get(fileDto.getStorage_url());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                String contentType = fileDto.getFile_type();
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileDto.getFile_name() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    //REST API TO GET ALL FILES
    @GetMapping
    public  ResponseEntity<List<FileDto>> getAllFiles(){
        List<FileDto>files = fileService.getAllFiles();
        return  ResponseEntity.ok(files);
    }

    //REST API to update files
    @PutMapping("{id}")
    public ResponseEntity<FileDto> updateFiles(@PathVariable("id") UUID file_id, @RequestBody FileDto FileDto){
       FileDto fileDto = fileService.updateFile(file_id, FileDto);
       return ResponseEntity.ok(fileDto);
    }

    //REST API TO DELETE A FILE
    @DeleteMapping("{id}")
    public  ResponseEntity<String> deleteFiles(@PathVariable("id") UUID file_id){
        fileService.deleteFile(file_id);
        return ResponseEntity.ok("File has been deleted successfully");
    }
}
