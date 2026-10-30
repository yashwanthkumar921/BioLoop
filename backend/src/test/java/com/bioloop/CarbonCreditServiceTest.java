package com.bioloop;

import com.bioloop.domain.enums.WasteType;
import com.bioloop.service.CarbonCreditService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CarbonCreditServiceTest {

    private final CarbonCreditService service = new CarbonCreditService();

    @Test
    void vegetableUsesBaseEmissionFactor() {
        assertEquals(29.0, service.calculateCO2Offset(50, WasteType.RAW_VEGETABLE), 0.0001);
    }

    @Test
    void cookedMeatAppliesHigherMultiplier() {
        assertEquals(0.58 * 10 * 1.3, service.calculateCO2Offset(10, WasteType.COOKED_MEAT), 0.0001);
    }
}
