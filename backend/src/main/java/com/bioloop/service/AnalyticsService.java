package com.bioloop.service;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.WasteTransaction;
import com.bioloop.domain.enums.Role;
import com.bioloop.domain.enums.WasteType;
import com.bioloop.repository.WasteTransactionRepository;
import com.bioloop.web.dto.AnalyticsDtos.ByType;
import com.bioloop.web.dto.AnalyticsDtos.Certificate;
import com.bioloop.web.dto.AnalyticsDtos.EsgSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AnalyticsService {

    private final WasteTransactionRepository transactions;

    public AnalyticsService(WasteTransactionRepository transactions) {
        this.transactions = transactions;
    }

    @Transactional(readOnly = true)
    public EsgSummary summary(AppUser user) {
        boolean isGenerator = user.getRole() == Role.GENERATOR;
        UUID generatorId = isGenerator ? user.getId() : null;

        BigDecimal co2 = isGenerator
                ? transactions.totalCo2OffsetByGenerator(generatorId)
                : transactions.totalCo2OffsetAll();
        if (co2 == null) co2 = BigDecimal.ZERO;

        BigDecimal diverted = isGenerator
                ? transactions.totalDivertedKgByGenerator(generatorId)
                : transactions.totalDivertedKgAll();
        if (diverted == null) diverted = BigDecimal.ZERO;

        List<Object[]> rawByType = isGenerator
                ? transactions.offsetsByWasteTypeByGenerator(generatorId)
                : transactions.offsetsByWasteTypeAll();

        List<ByType> byType = rawByType.stream()
                .map(row -> new ByType((WasteType) row[0], toBigDecimal(row[1]), toBigDecimal(row[2])))
                .toList();

        List<WasteTransaction> certSource = isGenerator
                ? transactions.findByBatchGeneratorAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(user)
                : transactions.findAll().stream().filter(t -> t.getVerifiedAt() != null).toList();

        List<Certificate> certificates = certSource.stream()
                .filter(t -> t.getCertificateCode() != null)
                .map(t -> new Certificate(
                        t.getCertificateCode(),
                        t.getBatch().getId().toString(),
                        t.getVerifiedAt(),
                        t.getCo2OffsetKg() != null ? t.getCo2OffsetKg() : BigDecimal.ZERO,
                        t.getVerifiedWeightKg() != null ? t.getVerifiedWeightKg() : t.getBatch().getWeightKg()
                ))
                .toList();

        return new EsgSummary(co2, diverted, certificates.size(), byType, certificates);
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number num) return BigDecimal.valueOf(num.doubleValue());
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
