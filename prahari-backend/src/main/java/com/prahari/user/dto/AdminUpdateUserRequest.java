package com.prahari.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for admin to update any user's details.
 * 
 * Admins can change role, active status, and all profile fields.
 * All fields are optional — only non-null fields are updated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequest {

    @Size(min = 2, max = 100)
    private String fullName;

    @Size(max = 20)
    private String phone;

    @Size(max = 20)
    private String whatsappId;

    @Size(max = 255)
    private String organization;

    /** Change user's role (CITIZEN, NGO, GOVERNMENT, SUPER_ADMIN) */
    private String role;

    /** Enable/disable user account */
    private Boolean isActive;
}
