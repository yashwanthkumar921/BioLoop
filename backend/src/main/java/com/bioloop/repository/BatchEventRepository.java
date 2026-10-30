package com.bioloop.repository;

import com.bioloop.domain.BatchEvent;
import com.bioloop.domain.WasteBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BatchEventRepository extends JpaRepository<BatchEvent, UUID> {
    List<BatchEvent> findByBatchOrderByCreatedAtAsc(WasteBatch batch);
}
