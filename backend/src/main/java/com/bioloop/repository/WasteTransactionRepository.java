package com.bioloop.repository;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.WasteBatch;
import com.bioloop.domain.WasteTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WasteTransactionRepository extends JpaRepository<WasteTransaction, UUID> {

    Optional<WasteTransaction> findByBatch(WasteBatch batch);

    List<WasteTransaction> findByDriverOrderByCreatedAtDesc(AppUser driver);

    @Query("""
            SELECT COALESCE(SUM(t.co2OffsetKg), 0)
            FROM WasteTransaction t
            WHERE t.verifiedAt IS NOT NULL
            """)
    BigDecimal totalCo2OffsetAll();

    @Query("""
            SELECT COALESCE(SUM(t.co2OffsetKg), 0)
            FROM WasteTransaction t
            JOIN t.batch b
            WHERE t.verifiedAt IS NOT NULL
              AND b.generator.id = :generatorId
            """)
    BigDecimal totalCo2OffsetByGenerator(@Param("generatorId") UUID generatorId);

    @Query("""
            SELECT COALESCE(SUM(COALESCE(t.verifiedWeightKg, b.weightKg)), 0)
            FROM WasteTransaction t
            JOIN t.batch b
            WHERE t.verifiedAt IS NOT NULL
            """)
    BigDecimal totalDivertedKgAll();

    @Query("""
            SELECT COALESCE(SUM(COALESCE(t.verifiedWeightKg, b.weightKg)), 0)
            FROM WasteTransaction t
            JOIN t.batch b
            WHERE t.verifiedAt IS NOT NULL
              AND b.generator.id = :generatorId
            """)
    BigDecimal totalDivertedKgByGenerator(@Param("generatorId") UUID generatorId);

    @Query("""
            SELECT b.wasteType, COALESCE(SUM(t.co2OffsetKg), 0), COALESCE(SUM(COALESCE(t.verifiedWeightKg, b.weightKg)), 0)
            FROM WasteTransaction t
            JOIN t.batch b
            WHERE t.verifiedAt IS NOT NULL
            GROUP BY b.wasteType
            """)
    List<Object[]> offsetsByWasteTypeAll();

    @Query("""
            SELECT b.wasteType, COALESCE(SUM(t.co2OffsetKg), 0), COALESCE(SUM(COALESCE(t.verifiedWeightKg, b.weightKg)), 0)
            FROM WasteTransaction t
            JOIN t.batch b
            WHERE t.verifiedAt IS NOT NULL
              AND b.generator.id = :generatorId
            GROUP BY b.wasteType
            """)
    List<Object[]> offsetsByWasteTypeByGenerator(@Param("generatorId") UUID generatorId);

    List<WasteTransaction> findByBatchGeneratorAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(AppUser generator);
}
