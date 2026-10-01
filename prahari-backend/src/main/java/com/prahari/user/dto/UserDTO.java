package com.prahari.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * User DTO — safe projection of the User entity for API responses.
 * 
 * Excludes sensitive fields (password_hash, raw location geometry).
 * Includes derived fields (longitude, latitude) from PostGIS Point.
 * 
 * Used by: UserController, AdminController
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String whatsappId;
    private String role;
    private String organization;
    private Boolean isActive;
    private Double longitude;
    private Double latitude;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
