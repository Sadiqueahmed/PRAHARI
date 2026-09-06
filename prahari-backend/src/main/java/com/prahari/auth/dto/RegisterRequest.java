package com.prahari.auth.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registration request DTO.
 * 
 * New users register with email, password, name, phone, and role.
 * Location (lat/lng) is optional at registration — it's typically
 * captured later via the browser's Geolocation API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    /** Phone number (optional at registration) */
    private String phone;

    /** WhatsApp ID — phone number without '+' prefix (e.g., "919876543210") */
    private String whatsappId;

    /**
     * Role to assign. Defaults to CITIZEN if not specified.
     * NGO and GOVERNMENT registrations may require admin approval in production.
     */
    private String role;

    /** Organization name — required for NGO and GOVERNMENT roles */
    private String organization;

    /** Optional: longitude for initial location */
    private Double longitude;

    /** Optional: latitude for initial location */
    private Double latitude;
}
