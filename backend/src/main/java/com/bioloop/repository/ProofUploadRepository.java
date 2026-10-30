package com.bioloop.repository;

import com.bioloop.domain.ProofUpload;
import com.bioloop.domain.WasteBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProofUploadRepository extends JpaRepository<ProofUpload, UUID> {
    List<ProofUpload> findByBatchOrderByCreatedAtDesc(WasteBatch batch);
}
