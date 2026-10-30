package com.bioloop.config;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.enums.Role;
import com.bioloop.domain.enums.WasteType;
import com.bioloop.repository.AppUserRepository;
import com.bioloop.service.BatchWorkflowService;
import com.bioloop.web.dto.BatchDtos.CreateBatchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    @Value("${bioloop.seed:true}")
    private boolean seed = true;

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final BatchWorkflowService workflow;

    @Autowired
    public DemoDataSeeder(
            AppUserRepository users,
            PasswordEncoder encoder,
            BatchWorkflowService workflow
    ) {
        this.users = users;
        this.encoder = encoder;
        this.workflow = workflow;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!seed) {
            return;
        }

        // Ensure fixed Executive Admin account is always present with fixed credentials
        if (!users.existsByEmailIgnoreCase("admin@bioloop.com")) {
            userWithPassword(
                    "admin@bioloop.com",
                    "BioLoop Executive Admin",
                    "Admin@BioLoop2026!",
                    Role.ADMIN,
                    12.9716,
                    77.5946,
                    "MG Road Central HQ, Bengaluru",
                    "+91 98804 45678"
            );
        }

        if (users.existsByEmailIgnoreCase("kitchen@greenleaf.demo")) {
            return;
        }

        AppUser generator = user(
                "kitchen@greenleaf.demo",
                "GreenLeaf Kitchen",
                Role.GENERATOR,
                12.9784,
                77.6408,
                "Indiranagar 100ft Road, Bengaluru",
                "+91 98801 12345"
        );

        user(
                "ops@urbancompost.demo",
                "Urban Compost Hub",
                Role.PROCESSOR,
                12.9698,
                77.7500,
                "Whitefield Eco Tech Park, Bengaluru",
                "+91 98802 23456"
        );

        user(
                "driver@bioloop.demo",
                "Loop Rider 07",
                Role.DRIVER,
                12.9352,
                77.6245,
                "Koramangala Depot, Bengaluru",
                "+91 98803 34567"
        );

        user(
                "audit@bioloop.demo",
                "BioLoop Admin",
                Role.ADMIN,
                12.9716,
                77.5946,
                "MG Road Central HQ, Bengaluru",
                "+91 98804 45678"
        );

        Instant now = Instant.now();

        workflow.create(generator, new CreateBatchRequest(
                WasteType.RAW_VEGETABLE,
                new BigDecimal("50.00"),
                12.9784,
                77.6408,
                "GreenLeaf Kitchen Loading Bay, Indiranagar, Bengaluru",
                now.plus(Duration.ofHours(4)),
                "Pre-consumer vegetable scraps. No packaging."
        ));

        workflow.create(generator, new CreateBatchRequest(
                WasteType.COFFEE_GROUNDS,
                new BigDecimal("18.50"),
                12.9340,
                77.6280,
                "Cafe Annex, 80ft Road, Koramangala 4th Block, Bengaluru",
                now.plus(Duration.ofHours(3)),
                "Same-day espresso grounds, bagged."
        ));

        workflow.create(generator, new CreateBatchRequest(
                WasteType.BAKERY,
                new BigDecimal("12.00"),
                12.9705,
                77.5980,
                "Artisan Bakery, Lavelle Road, Bengaluru",
                now.plus(Duration.ofHours(2)),
                "Day-old bread, no frosting."
        ));

        workflow.create(generator, new CreateBatchRequest(
                WasteType.MIXED_ORGANIC,
                new BigDecimal("35.00"),
                12.9121,
                77.6446,
                "Organic Food Market, HSR Sector 1, Bengaluru",
                now.plus(Duration.ofHours(5)),
                "Market surplus produce, crates provided."
        ));
    }

    private AppUser user(String email, String org, Role role, double lat, double lng, String address, String phone) {
        return userWithPassword(email, org, "password123", role, lat, lng, address, phone);
    }

    private AppUser userWithPassword(String email, String org, String password, Role role, double lat, double lng, String address, String phone) {
        if (users.existsByEmailIgnoreCase(email)) {
            return users.findByEmailIgnoreCase(email).orElse(null);
        }
        Instant now = Instant.now();
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(password));
        user.setOrgName(org);
        user.setRole(role);
        user.setLatitude(lat);
        user.setLongitude(lng);
        user.setAddress(address);
        user.setPhone(phone);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        return users.save(user);
    }
}
