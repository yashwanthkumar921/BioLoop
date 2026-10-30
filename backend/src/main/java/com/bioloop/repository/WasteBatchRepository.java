package com.bioloop.repository;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.WasteBatch;
import com.bioloop.domain.enums.BatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WasteBatchRepository extends JpaRepository<WasteBatch, UUID> {

    List<WasteBatch> findByGeneratorOrderByCreatedAtDesc(AppUser generator);

    List<WasteBatch> findByProcessorOrderByCreatedAtDesc(AppUser processor);

    List<WasteBatch> findByStatusAndExpiryTimeBefore(BatchStatus status, Instant cutoff);

    Optional<WasteBatch> findByQrToken(String qrToken);

    List<WasteBatch> findByStatusOrderByCreatedAtDesc(BatchStatus status);

    List<WasteBatch> findByStatusAndExpiryTimeAfterOrderByCreatedAtDesc(BatchStatus status, Instant cutoff);
}

