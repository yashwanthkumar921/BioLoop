package com.bioloop.service;

import com.bioloop.domain.enums.WasteType;
import org.springframework.stereotype.Service;

@Service
public class CarbonCreditService {

    // Standard EPA conversion factor: ~0.58 kg CO2e saved per kg food waste diverted
    private static final double EMISSION_FACTOR = 0.58;

    public double calculateCO2Offset(double weightKg, WasteType type) {
        double multiplier = switch (type) {
            case RAW_VEGETABLE -> 1.0;
            case COOKED_MEAT -> 1.3;
            case COFFEE_GROUNDS -> 0.8;
            case MIXED_ORGANIC -> 1.05;
            case DAIRY -> 1.15;
            case BAKERY -> 0.9;
        };
        return weightKg * EMISSION_FACTOR * multiplier;
    }
}
