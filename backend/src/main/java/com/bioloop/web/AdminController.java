package com.bioloop.web;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.enums.Role;
import com.bioloop.exception.ApiException;
import com.bioloop.repository.AppUserRepository;
import com.bioloop.security.SecurityUtils;
import com.bioloop.service.AuthService;
import com.bioloop.web.dto.AuthDtos.UserResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminController(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    private void requireAdmin() {
        AppUser current = SecurityUtils.currentUser();
        if (current.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrative privileges required to manage network personnel");
        }
    }

    public record CreateMemberRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String orgName,
            @NotNull Role role,
            String address,
            String phone,
            Double latitude,
            Double longitude
    ) {}

    @GetMapping("/members")
    public List<UserResponse> listMembers(@RequestParam(name = "role", required = false) Role role) {
        requireAdmin();
        List<AppUser> list;
        if (role != null) {
            list = users.findByRole(role);
        } else {
            list = users.findAll();
        }
        return list.stream().map(AuthService::toResponse).toList();
    }

    @PostMapping("/members")
    @Transactional
    public UserResponse createMember(@RequestBody CreateMemberRequest req) {
        requireAdmin();
        if (req.role() == Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Secondary administrator accounts cannot be provisioned here");
        }
        if (req.email() == null || req.email().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address is required");
        }
        String cleanEmail = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "A user or organization with this email address is already registered");
        }
        if (req.password() == null || req.password().length() < 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters long");
        }
        if (req.orgName() == null || req.orgName().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization / Member name is required");
        }

        Instant now = Instant.now();
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setOrgName(req.orgName().trim());
        user.setRole(req.role());
        user.setAddress(req.address() != null && !req.address().trim().isEmpty() ? req.address().trim() : "Bengaluru, Karnataka");
        user.setPhone(req.phone() != null && !req.phone().trim().isEmpty() ? req.phone().trim() : null);
        user.setLatitude(req.latitude() != null ? req.latitude() : 12.9716);
        user.setLongitude(req.longitude() != null ? req.longitude() : 77.5946);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        users.save(user);

        return AuthService.toResponse(user);
    }

    @DeleteMapping("/members/{id}")
    @Transactional
    public void deleteMember(@PathVariable(name = "id") UUID id) {
        requireAdmin();
        AppUser current = SecurityUtils.currentUser();
        if (current.getId().equals(id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own active administrator account");
        }
        users.deleteById(id);
    }
}

