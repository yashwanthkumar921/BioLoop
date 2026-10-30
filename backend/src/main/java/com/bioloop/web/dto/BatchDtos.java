package com.bioloop.web.dto;

import com.bioloop.domain.enums.BatchStatus;
import com.bioloop.domain.enums.ProofKind;
import com.bioloop.domain.enums.WasteType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public final class BatchDtos {

    private BatchDtos() {
    }

    public record CreateBatchRequest(
            @NotNull WasteType wasteType,
            @NotNull @Positive BigDecimal weightKg,
            @NotNull Double latitude,
            @NotNull Double longitude,
            String pickupAddress,
            Instant expiryTime,
            String notes
    ) {
    }

    public record StatusUpdateRequest(
            @NotNull BatchStatus status,
            String qrToken,
            String note
    ) {
    }

    public record VerifyRequest(
            @NotNull @Positive BigDecimal verifiedWeightKg,
            @NotNull BigDecimal contaminationPct,
            String contaminationNotes
    ) {
    }

    public record NearbyBatchResponse(
            String id,
            WasteType wasteType,
            BigDecimal weightKg,
            Instant expiryTime,
            String pickupAddress,
            Double pickupLat,
            Double pickupLng,
            Double distanceKm,
            String orgName,
            String notes,
            BatchStatus status
    ) {
    }

    public record BatchResponse(
            String id,
            String generatorId,
            String generatorOrg,
            String processorId,
            String processorOrg,
            String driverId,
            String driverOrg,
            WasteType wasteType,
            BigDecimal weightKg,
            BatchStatus status,
            Double pickupLat,
            Double pickupLng,
            String pickupAddress,
            Instant expiryTime,
            String qrToken,
            String notes,
            Instant createdAt,
            BigDecimal contaminationPct,
            BigDecimal co2OffsetKg,
            String certificateCode
    ) {
    }

    public record BatchEventResponse(
            String id,
            String actorId,
            String actorName,
            String fromStatus,
            String toStatus,
            String note,
            Instant createdAt
    ) {
    }

    public record ProofUploadResponse(
            String id,
            String batchId,
            String uploadedById,
            String uploaderName,
            ProofKind kind,
            String fileUrl,
            Instant createdAt
    ) {
    }
}
