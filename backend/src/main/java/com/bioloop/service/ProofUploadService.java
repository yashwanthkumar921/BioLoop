package com.bioloop.service;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.ProofUpload;
import com.bioloop.domain.WasteBatch;
import com.bioloop.domain.enums.ProofKind;
import com.bioloop.exception.ApiException;
import com.bioloop.repository.ProofUploadRepository;
import com.bioloop.repository.WasteBatchRepository;
import com.bioloop.web.dto.BatchDtos.ProofUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ProofUploadService {

    private final Path rootDir;
    private final ProofUploadRepository proofs;
    private final WasteBatchRepository batches;

    public ProofUploadService(
            @Value("${bioloop.upload-dir:uploads}") String uploadDir,
            ProofUploadRepository proofs,
            WasteBatchRepository batches
    ) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.proofs = proofs;
        this.batches = batches;
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not initialize upload storage folder", e);
        }
    }

    @Transactional
    public ProofUploadResponse uploadProof(AppUser user, UUID batchId, ProofKind kind, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File cannot be empty");
        }

        WasteBatch batch = batches.findById(batchId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Batch not found"));

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "proof.jpg"));
        String extension = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalFilename.substring(dot);
        }
        String storedName = UUID.randomUUID() + extension;
        Path targetPath = rootDir.resolve(storedName).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store proof image");
        }

        Instant now = Instant.now();
        ProofUpload proof = new ProofUpload();
        proof.setId(UUID.randomUUID());
        proof.setBatch(batch);
        proof.setUploadedBy(user);
        proof.setKind(kind);
        proof.setFilePath(storedName);
        proof.setCreatedAt(now);
        proofs.save(proof);

        return toResponse(proof);
    }

    @Transactional(readOnly = true)
    public List<ProofUploadResponse> getProofs(UUID batchId) {
        WasteBatch batch = batches.findById(batchId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Batch not found"));
        return proofs.findByBatchOrderByCreatedAtDesc(batch).stream()
                .map(this::toResponse)
                .toList();
    }

    public Resource loadAsResource(String filename) {
        try {
            Path file = rootDir.resolve(filename).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new ApiException(HttpStatus.NOT_FOUND, "File not found");
            }
        } catch (MalformedURLException e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "File not found");
        }
    }

    private ProofUploadResponse toResponse(ProofUpload proof) {
        return new ProofUploadResponse(
                proof.getId().toString(),
                proof.getBatch().getId().toString(),
                proof.getUploadedBy().getId().toString(),
                proof.getUploadedBy().getOrgName(),
                proof.getKind(),
                "/api/v1/files/" + proof.getFilePath(),
                proof.getCreatedAt()
        );
    }
}

