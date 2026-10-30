package com.bioloop.service;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.BatchEvent;
import com.bioloop.domain.WasteBatch;
import com.bioloop.domain.WasteTransaction;
import com.bioloop.domain.enums.BatchStatus;
import com.bioloop.domain.enums.Role;
import com.bioloop.exception.ApiException;
import com.bioloop.geo.GeoUtils;
import com.bioloop.repository.BatchEventRepository;
import com.bioloop.repository.WasteBatchRepository;
import com.bioloop.repository.WasteTransactionRepository;
import com.bioloop.web.dto.BatchDtos.BatchResponse;
import com.bioloop.web.dto.BatchDtos.CreateBatchRequest;
import com.bioloop.web.dto.BatchDtos.NearbyBatchResponse;
import com.bioloop.web.dto.BatchDtos.StatusUpdateRequest;
import com.bioloop.web.dto.BatchDtos.VerifyRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class BatchWorkflowService {

    private final WasteBatchRepository batches;
    private final WasteTransactionRepository transactions;
    private final BatchEventRepository events;
    private final CarbonCreditService carbonCreditService;

    public BatchWorkflowService(
            WasteBatchRepository batches,
            WasteTransactionRepository transactions,
            BatchEventRepository events,
            CarbonCreditService carbonCreditService
    ) {
        this.batches = batches;
        this.transactions = transactions;
        this.events = events;
        this.carbonCreditService = carbonCreditService;
    }

    @Transactional
    public BatchResponse create(AppUser generator, CreateBatchRequest request) {
        requireRole(generator, Role.GENERATOR, Role.ADMIN);
        Instant now = Instant.now();
        Instant expiry = request.expiryTime() != null ? request.expiryTime() : now.plus(Duration.ofHours(4));
        WasteBatch batch = new WasteBatch();
        batch.setId(UUID.randomUUID());
        batch.setGenerator(generator);
        batch.setWasteType(request.wasteType());
        batch.setWeightKg(request.weightKg());
        batch.setStatus(BatchStatus.AVAILABLE);
        batch.setPickupLat(request.latitude());
        batch.setPickupLng(request.longitude());
        batch.setPickupAddress(request.pickupAddress());
        batch.setExpiryTime(expiry);
        batch.setQrToken(UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT));
        batch.setNotes(request.notes());
        batch.setCreatedAt(now);
        batch.setUpdatedAt(now);
        batches.save(batch);
        recordEvent(batch, generator, null, BatchStatus.AVAILABLE, "Batch posted");
        return toResponse(batch, null);
    }

    @Transactional(readOnly = true)
    public List<NearbyBatchResponse> nearby(double lat, double lng, double radiusKm) {
        Instant now = Instant.now();
        return batches.findByStatusAndExpiryTimeAfterOrderByCreatedAtDesc(BatchStatus.AVAILABLE, now).stream()
                .map(batch -> {
                    double dist = GeoUtils.haversineKm(
                            lat, lng,
                            batch.getPickupLat() != null ? batch.getPickupLat() : 0.0,
                            batch.getPickupLng() != null ? batch.getPickupLng() : 0.0
                    );
                    return new NearbyBatchResponse(
                            batch.getId().toString(),
                            batch.getWasteType(),
                            batch.getWeightKg(),
                            batch.getExpiryTime(),
                            batch.getPickupAddress(),
                            batch.getPickupLat(),
                            batch.getPickupLng(),
                            BigDecimal.valueOf(dist).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                            batch.getGenerator().getOrgName(),
                            batch.getNotes(),
                            BatchStatus.AVAILABLE
                    );
                })
                .filter(res -> res.distanceKm() <= radiusKm)
                .sorted((a, b) -> Double.compare(a.distanceKm(), b.distanceKm()))
                .toList();
    }

    @Transactional
    public BatchResponse claim(AppUser processor, UUID batchId) {
        requireRole(processor, Role.PROCESSOR, Role.ADMIN);
        WasteBatch batch = load(batchId);
        expireIfNeeded(batch);
        if (batch.getStatus() != BatchStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "Batch is not available to claim");
        }
        BatchStatus from = batch.getStatus();
        batch.setProcessor(processor);
        batch.setStatus(BatchStatus.CLAIMED);
        batches.save(batch);
        WasteTransaction txn = transactions.findByBatch(batch).orElseGet(() -> {
            WasteTransaction created = new WasteTransaction();
            created.setId(UUID.randomUUID());
            created.setBatch(batch);
            created.setCreatedAt(Instant.now());
            created.setContaminationPct(BigDecimal.ZERO);
            return created;
        });
        transactions.save(txn);
        recordEvent(batch, processor, from, BatchStatus.CLAIMED, "Processor claimed batch");
        return toResponse(batch, txn);
    }

    @Transactional
    public BatchResponse acceptJob(AppUser driver, UUID batchId) {
        requireRole(driver, Role.DRIVER, Role.ADMIN);
        WasteBatch batch = load(batchId);
        if (batch.getStatus() != BatchStatus.CLAIMED) {
            throw new ApiException(HttpStatus.CONFLICT, "Job can only be accepted after a processor claims the batch");
        }
        WasteTransaction txn = requireTxn(batch);
        if (txn.getDriver() != null && !txn.getDriver().getId().equals(driver.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Another driver already accepted this job");
        }
        txn.setDriver(driver);
        transactions.save(txn);
        recordEvent(batch, driver, BatchStatus.CLAIMED, BatchStatus.CLAIMED, "Driver accepted transport job");
        return toResponse(batch, txn);
    }

    @Transactional
    public BatchResponse updateStatus(AppUser actor, UUID batchId, StatusUpdateRequest request) {
        WasteBatch batch = load(batchId);
        expireIfNeeded(batch);
        WasteTransaction txn = transactions.findByBatch(batch).orElse(null);
        BatchStatus target = request.status();
        return switch (target) {
            case IN_TRANSIT -> pickupScan(actor, batch, txn, request.qrToken());
            case DELIVERED -> deliver(actor, batch, txn, request.note());
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Use dedicated endpoints for this transition");
        };
    }

    @Transactional
    public BatchResponse verify(AppUser processor, UUID batchId, VerifyRequest request) {
        requireRole(processor, Role.PROCESSOR, Role.ADMIN);
        WasteBatch batch = load(batchId);
        if (batch.getProcessor() == null || !batch.getProcessor().getId().equals(processor.getId())) {
            if (processor.getRole() != Role.ADMIN) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Only the claiming processor can verify this batch");
            }
        }
        if (batch.getStatus() != BatchStatus.DELIVERED) {
            throw new ApiException(HttpStatus.CONFLICT, "Batch must be delivered before verification");
        }
        WasteTransaction txn = requireTxn(batch);
        txn.setVerifiedWeightKg(request.verifiedWeightKg());
        txn.setContaminationPct(request.contaminationPct());
        txn.setContaminationNotes(request.contaminationNotes());
        txn.setVerifiedAt(Instant.now());
        BatchStatus from = batch.getStatus();
        if (request.contaminationPct().compareTo(new BigDecimal("25")) > 0) {
            batch.setStatus(BatchStatus.REJECTED);
            recordEvent(batch, processor, from, BatchStatus.REJECTED, "Rejected due to contamination");
        } else {
            double offset = carbonCreditService.calculateCO2Offset(
                    request.verifiedWeightKg().doubleValue(), batch.getWasteType());
            txn.setCo2OffsetKg(BigDecimal.valueOf(offset).setScale(4, RoundingMode.HALF_UP));
            txn.setCertificateCode("BL-" + batch.getQrToken());
            batch.setStatus(BatchStatus.VERIFIED);
            recordEvent(batch, processor, from, BatchStatus.VERIFIED, "Verified and certificate issued");
        }
        batches.save(batch);
        transactions.save(txn);
        return toResponse(batch, txn);
    }

    @Transactional(readOnly = true)
    public BatchResponse get(UUID id) {
        WasteBatch batch = load(id);
        return toResponse(batch, transactions.findByBatch(batch).orElse(null));
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> openJobs() {
        return batches.findByStatusOrderByCreatedAtDesc(BatchStatus.CLAIMED).stream()
                .map(batch -> toResponse(batch, transactions.findByBatch(batch).orElse(null)))
                .filter(batch -> batch.driverId() == null)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> mine(AppUser user) {
        List<WasteBatch> list = switch (user.getRole()) {
            case GENERATOR -> batches.findByGeneratorOrderByCreatedAtDesc(user);
            case PROCESSOR -> batches.findByProcessorOrderByCreatedAtDesc(user);
            case DRIVER -> transactions.findByDriverOrderByCreatedAtDesc(user).stream()
                    .map(WasteTransaction::getBatch)
                    .toList();
            case ADMIN -> batches.findAll();
        };
        return list.stream()
                .map(batch -> toResponse(batch, transactions.findByBatch(batch).orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.bioloop.web.dto.BatchDtos.BatchEventResponse> getEvents(UUID id) {
        WasteBatch batch = load(id);
        return events.findByBatchOrderByCreatedAtAsc(batch).stream()
                .map(e -> new com.bioloop.web.dto.BatchDtos.BatchEventResponse(
                        e.getId().toString(),
                        e.getActor() == null ? null : e.getActor().getId().toString(),
                        e.getActor() == null ? "System" : e.getActor().getOrgName(),
                        e.getFromStatus() == null ? null : e.getFromStatus().name(),
                        e.getToStatus().name(),
                        e.getNote(),
                        e.getCreatedAt()
                ))
                .toList();
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    @Transactional
    public void expireBatchesScheduled() {
        List<WasteBatch> expired = batches.findByStatusAndExpiryTimeBefore(BatchStatus.AVAILABLE, Instant.now());
        for (WasteBatch batch : expired) {
            batch.setStatus(BatchStatus.EXPIRED);
            batches.save(batch);
            recordEvent(batch, null, BatchStatus.AVAILABLE, BatchStatus.EXPIRED, "Pickup window expired automatically");
        }
    }

    private BatchResponse pickupScan(AppUser actor, WasteBatch batch, WasteTransaction txn, String qrToken) {
        requireRole(actor, Role.DRIVER, Role.ADMIN);
        if (batch.getStatus() != BatchStatus.CLAIMED) {
            throw new ApiException(HttpStatus.CONFLICT, "Pickup scan requires CLAIMED status");
        }
        if (qrToken == null || !qrToken.equalsIgnoreCase(batch.getQrToken())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "QR token does not match this batch");
        }
        WasteTransaction live = txn != null ? txn : requireTxn(batch);
        if (live.getDriver() == null) {
            live.setDriver(actor);
        } else if (!live.getDriver().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This job belongs to another driver");
        }
        BatchStatus from = batch.getStatus();
        batch.setStatus(BatchStatus.IN_TRANSIT);
        live.setPickupScannedAt(Instant.now());
        batches.save(batch);
        transactions.save(live);
        recordEvent(batch, actor, from, BatchStatus.IN_TRANSIT, "QR scanned at pickup");
        return toResponse(batch, live);
    }

    private BatchResponse deliver(AppUser actor, WasteBatch batch, WasteTransaction txn, String note) {
        requireRole(actor, Role.DRIVER, Role.PROCESSOR, Role.ADMIN);
        if (batch.getStatus() != BatchStatus.IN_TRANSIT) {
            throw new ApiException(HttpStatus.CONFLICT, "Delivery requires IN_TRANSIT status");
        }
        WasteTransaction live = txn != null ? txn : requireTxn(batch);
        BatchStatus from = batch.getStatus();
        batch.setStatus(BatchStatus.DELIVERED);
        live.setDeliveredAt(Instant.now());
        batches.save(batch);
        transactions.save(live);
        recordEvent(batch, actor, from, BatchStatus.DELIVERED, note == null ? "Delivered to processor" : note);
        return toResponse(batch, live);
    }

    private void expireIfNeeded(WasteBatch batch) {
        if (batch.getStatus() == BatchStatus.AVAILABLE && batch.getExpiryTime().isBefore(Instant.now())) {
            batch.setStatus(BatchStatus.EXPIRED);
            batches.save(batch);
            recordEvent(batch, null, BatchStatus.AVAILABLE, BatchStatus.EXPIRED, "Pickup window expired");
        }
    }

    private WasteBatch load(UUID id) {
        return batches.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Batch not found"));
    }

    private WasteTransaction requireTxn(WasteBatch batch) {
        return transactions.findByBatch(batch)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Transaction not initialized"));
    }

    private void recordEvent(WasteBatch batch, AppUser actor, BatchStatus from, BatchStatus to, String note) {
        BatchEvent event = new BatchEvent();
        event.setId(UUID.randomUUID());
        event.setBatch(batch);
        event.setActor(actor);
        event.setFromStatus(from);
        event.setToStatus(to);
        event.setNote(note);
        event.setCreatedAt(Instant.now());
        events.save(event);
    }

    private void requireRole(AppUser user, Role... allowed) {
        for (Role role : allowed) {
            if (user.getRole() == role) {
                return;
            }
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Role " + user.getRole() + " cannot perform this action");
    }


    private BatchResponse toResponse(WasteBatch batch, WasteTransaction txn) {
        return new BatchResponse(
                batch.getId().toString(),
                batch.getGenerator().getId().toString(),
                batch.getGenerator().getOrgName(),
                batch.getProcessor() == null ? null : batch.getProcessor().getId().toString(),
                batch.getProcessor() == null ? null : batch.getProcessor().getOrgName(),
                txn == null || txn.getDriver() == null ? null : txn.getDriver().getId().toString(),
                txn == null || txn.getDriver() == null ? null : txn.getDriver().getOrgName(),
                batch.getWasteType(),
                batch.getWeightKg(),
                batch.getStatus(),
                batch.getPickupLat(),
                batch.getPickupLng(),
                batch.getPickupAddress(),
                batch.getExpiryTime(),
                canSeeQr(batch) ? batch.getQrToken() : null,
                batch.getNotes(),
                batch.getCreatedAt(),
                txn == null ? null : txn.getContaminationPct(),
                txn == null ? null : txn.getCo2OffsetKg(),
                txn == null ? null : txn.getCertificateCode()
        );
    }

    private boolean canSeeQr(WasteBatch batch) {
        return true;
    }
}
