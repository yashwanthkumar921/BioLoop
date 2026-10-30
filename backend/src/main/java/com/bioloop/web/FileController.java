package com.bioloop.web;

import com.bioloop.service.ProofUploadService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final ProofUploadService proofUploadService;

    public FileController(ProofUploadService proofUploadService) {
        this.proofUploadService = proofUploadService;
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable("filename") String filename) {
        Resource file = proofUploadService.loadAsResource(filename);
        String contentType = "application/octet-stream";
        try {
            if (file.getFile().toPath() != null) {
                String detected = Files.probeContentType(file.getFile().toPath());
                if (detected != null) {
                    contentType = detected;
                }
            }
        } catch (IOException ignored) {
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }
}

