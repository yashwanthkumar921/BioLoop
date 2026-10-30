package com.bioloop.web;

import com.bioloop.security.SecurityUtils;
import com.bioloop.service.AnalyticsService;
import com.bioloop.web.dto.AnalyticsDtos.EsgSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/esg")
    public EsgSummary esg() {
        return analyticsService.summary(SecurityUtils.currentUser());
    }
}
