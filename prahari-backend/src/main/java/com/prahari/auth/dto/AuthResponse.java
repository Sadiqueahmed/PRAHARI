package com.prahari.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Authentication response DTO.
 * Returned after successful login or registration.
 * Contains the JWT token and basic user info for the frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /** JWT access token — include in Authorization: Bearer header */
    private String token;

    /** User's unique identifier */
    private UUID userId;

    /** User's email address */
    private String email;

    /** User's display name */
    private String fullName;

    /** User's RBAC role (CITIZEN, NGO, GOVERNMENT, SUPER_ADMIN) */
    private String role;
}
