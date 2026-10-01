package com.prahari.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a user's own profile.
 * 
 * All fields are optional — only non-null fields are updated.
 * The user cannot change their own role or email via this endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Size(max = 20, message = "Phone number must be at most 20 characters")
    private String phone;

    @Size(max = 20, message = "WhatsApp ID must be at most 20 characters")
    private String whatsappId;

    @Size(max = 255, message = "Organization must be at most 255 characters")
    private String organization;

    /** GPS longitude for location update */
    private Double longitude;

    /** GPS latitude for location update */
    private Double latitude;
}
