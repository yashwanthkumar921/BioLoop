package com.bioloop.web.dto;

import com.bioloop.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String orgName,
            @NotNull Role role,
            Double latitude,
            Double longitude,
            String address,
            String phone
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(
            String token,
            UserResponse user
    ) {
    }

    public record UserResponse(
            String id,
            String email,
            String orgName,
            Role role,
            Double latitude,
            Double longitude,
            String address,
            String phone
    ) {
    }
}
