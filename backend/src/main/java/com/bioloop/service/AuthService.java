package com.bioloop.service;

import com.bioloop.domain.AppUser;
import com.bioloop.domain.enums.Role;
import com.bioloop.exception.ApiException;
import com.bioloop.repository.AppUserRepository;
import com.bioloop.security.JwtService;
import com.bioloop.web.dto.AuthDtos;
import com.bioloop.web.dto.AuthDtos.AuthResponse;
import com.bioloop.web.dto.AuthDtos.LoginRequest;
import com.bioloop.web.dto.AuthDtos.RegisterRequest;
import com.bioloop.web.dto.AuthDtos.UserResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired
    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registration payload is missing");
        }
        if (request.role() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Account role is required");
        }
        if (request.role() == Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Public registration as administrator is not permitted. Please contact BioLoop system administrators.");
        }
        if (request.email() == null || request.email().trim().isEmpty() || !request.email().trim().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a valid email address");
        }
        String cleanEmail = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email address already exists. Please sign in instead.");
        }
        if (request.password() == null || request.password().length() < 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters long");
        }
        if (request.orgName() == null || request.orgName().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization or Business name is required");
        }

        Instant now = Instant.now();
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setOrgName(request.orgName().trim());
        user.setRole(request.role());
        user.setAddress(request.address() != null && !request.address().trim().isEmpty() ? request.address().trim() : "Bengaluru, Karnataka");
        user.setPhone(request.phone() != null && !request.phone().trim().isEmpty() ? request.phone().trim() : null);
        user.setLatitude(request.latitude() != null ? request.latitude() : 12.9716);
        user.setLongitude(request.longitude() != null ? request.longitude() : 77.5946);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        users.save(user);

        return new AuthResponse(jwtService.issue(user), toResponse(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        if (request == null || request.email() == null || request.password() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }
        String cleanEmail = request.email().trim().toLowerCase();
        AppUser user = users.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return new AuthResponse(jwtService.issue(user), toResponse(user));
    }

    public static UserResponse toResponse(AppUser user) {
        if (user == null) {
            return null;
        }
        return new UserResponse(
                user.getId() != null ? user.getId().toString() : null,
                user.getEmail(),
                user.getOrgName(),
                user.getRole(),
                user.getLatitude(),
                user.getLongitude(),
                user.getAddress(),
                user.getPhone()
        );
    }
}
