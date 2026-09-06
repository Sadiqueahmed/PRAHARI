package com.prahari.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * User entity with PostGIS spatial location.
 * 
 * The {@code location} field stores the user's last known GPS coordinates
 * as a PostGIS Point (SRID 4326 = WGS 84). This is used by the Alert Engine
 * to determine if a user falls within a newly created hazard polygon via
 * PostGIS {@code ST_Within} spatial queries.
 * 
 * Table: {@code users}
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 20)
    private String phone;

    /**
     * WhatsApp phone number (without '+' prefix) for Business API integration.
     * Format: country code + number (e.g., "919876543210" for Indian numbers).
     */
    @Column(name = "whatsapp_id", length = 20)
    private String whatsappId;

    /**
     * User's RBAC role. Stored as the enum ordinal name (STRING) in the database.
     * Maps to the {@code roles} table via {@code role_id}.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role_id", nullable = false)
    private Role role;

    /**
     * User's last known GPS location as a PostGIS Point.
     * SRID 4326 = WGS 84 (standard GPS coordinate system).
     * 
     * Used by: AlertOrchestrator → ST_Within(user.location, hazard_zone.geometry)
     */
    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    /**
     * Organization name — relevant for NGO and Government users.
     * NGO: Organization name (e.g., "Assam Flood Relief Foundation")
     * Government: Department (e.g., "NDMA - Northeast Division")
     */
    @Column(length = 255)
    private String organization;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
