package com.bioloop.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface NearbyBatchProjection {
    UUID getId();

    String getWasteType();

    BigDecimal getWeightKg();

    Instant getExpiryTime();

    String getPickupAddress();

    Double getPickupLat();

    Double getPickupLng();

    Double getDistanceKm();

    String getOrgName();

    String getNotes();
}
