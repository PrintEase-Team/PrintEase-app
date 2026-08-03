package com.group108.printease.mapper;

import com.group108.printease.dto.FileDto;
import com.group108.printease.entities.Files;
import com.group108.printease.entities.Orders;
import com.group108.printease.entities.Users;

public class Filesmapper {

    public static FileDto mapToFileDto(Files files) {
        return new FileDto(
                files.getFile_id(),
                files.getOrder_id() != null ? files.getOrder_id().getOrder_id() :  null,
                files.getUploaded_by() != null ? files.getUploaded_by().getUserId() : null,
                files.getFile_name(),
                files.getFile_type(),
                files.getFile_size_kb(),
                files.getStorage_url(),
                files.getPage_count(),
                files.getUploaded_at(),
                files.is_deleted(),
                files.getDeleted_at()
        );
    }

    public static Files mapToFile(FileDto fileDto, Orders order, Users uploadedBy) {
        Files files = new Files();
        files.setFile_id(fileDto.getFile_id());
        files.setOrder_id(order);
        files.setUploaded_by(uploadedBy);
        files.setFile_name(fileDto.getFile_name());
        files.setFile_type(fileDto.getFile_type());
        files.setFile_size_kb(fileDto.getFile_size_kb());
        files.setStorage_url(fileDto.getStorage_url());
        files.setPage_count(fileDto.getPage_count());
        files.setDeleted_at(fileDto.getDeleted_at());
        return files;
    }
}
