package com.bioloop.web.dto;

import com.bioloop.domain.enums.WasteType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AnalyticsDtos {

    private AnalyticsDtos() {
    }

    public record EsgSummary(
            BigDecimal totalCo2OffsetKg,
            BigDecimal totalDivertedKg,
            long verifiedBatches,
            List<ByType> byType,
            List<Certificate> certificates
    ) {
    }

    public record ByType(
            WasteType wasteType,
            BigDecimal co2OffsetKg,
            BigDecimal divertedKg
    ) {
    }

    public record Certificate(
            String code,
            String batchId,
            Instant verifiedAt,
            BigDecimal co2OffsetKg,
            BigDecimal weightKg
    ) {
    }
}
