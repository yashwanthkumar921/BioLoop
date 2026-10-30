package com.bioloop.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class WasteTransaction {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id")
    private WasteBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private AppUser driver;

    @Column(name = "contamination_pct", nullable = false)
    private BigDecimal contaminationPct = BigDecimal.ZERO;

    @Column(name = "verified_weight_kg")
    private BigDecimal verifiedWeightKg;

    @Column(name = "co2_offset_kg")
    private BigDecimal co2OffsetKg;

    @Column(name = "pickup_scanned_at")
    private Instant pickupScannedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "contamination_notes")
    private String contaminationNotes;

    @Column(name = "certificate_code")
    private String certificateCode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @jakarta.persistence.PrePersist
    void init() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.contaminationPct == null) this.contaminationPct = BigDecimal.ZERO;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public WasteBatch getBatch() {
        return batch;
    }

    public void setBatch(WasteBatch batch) {
        this.batch = batch;
    }

    public AppUser getDriver() {
        return driver;
    }

    public void setDriver(AppUser driver) {
        this.driver = driver;
    }

    public BigDecimal getContaminationPct() {
        return contaminationPct;
    }

    public void setContaminationPct(BigDecimal contaminationPct) {
        this.contaminationPct = contaminationPct;
    }

    public BigDecimal getVerifiedWeightKg() {
        return verifiedWeightKg;
    }

    public void setVerifiedWeightKg(BigDecimal verifiedWeightKg) {
        this.verifiedWeightKg = verifiedWeightKg;
    }

    public BigDecimal getCo2OffsetKg() {
        return co2OffsetKg;
    }

    public void setCo2OffsetKg(BigDecimal co2OffsetKg) {
        this.co2OffsetKg = co2OffsetKg;
    }

    public Instant getPickupScannedAt() {
        return pickupScannedAt;
    }

    public void setPickupScannedAt(Instant pickupScannedAt) {
        this.pickupScannedAt = pickupScannedAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getContaminationNotes() {
        return contaminationNotes;
    }

    public void setContaminationNotes(String contaminationNotes) {
        this.contaminationNotes = contaminationNotes;
    }

    public String getCertificateCode() {
        return certificateCode;
    }

    public void setCertificateCode(String certificateCode) {
        this.certificateCode = certificateCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
