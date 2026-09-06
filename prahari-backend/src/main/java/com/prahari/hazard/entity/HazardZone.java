package com.prahari.hazard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Geometry;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Hazard Zone entity — the core of the Digital Twin.
 * 
 * Each hazard zone represents an active or historical hazard area on the map.
 * The {@code geometry} field stores a PostGIS polygon (or multi-polygon) that
 * defines the spatial extent of the hazard.
 * 
 * When a new hazard zone is created, the Alert Engine uses PostGIS
 * {@code ST_Within} to find all users whose location falls within the
 * hazard polygon, then fans out WhatsApp/SMS alerts to affected users.
 * 
 * Table: {@code hazard_zones}
 */
@Entity
@Table(name = "hazard_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HazardZone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Type of hazard (FLOOD, EARTHQUAKE, LANDSLIDE, AIR_QUALITY).
     * Determines which map layer this zone belongs to.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "hazard_type", nullable = false, length = 20)
    private HazardType hazardType;

    /**
     * Severity level — determines alert priority and UI rendering.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Severity severity;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * PostGIS geometry representing the hazard area.
     * Can be a Polygon (flood zone, landslide area) or a circular buffer
     * (earthquake impact radius). SRID 4326 = WGS 84.
     * 
     * Critical for: ST_Within(user.location, hazard_zone.geometry)
     */
    @Column(columnDefinition = "geometry(Geometry, 4326)", nullable = false)
    private Geometry geometry;

    /**
     * Radius in kilometers — primarily used for earthquake zones.
     * The geometry column stores the actual buffered polygon; this field
     * is for display/reference purposes.
     */
    @Column(name = "radius_km")
    private Double radiusKm;

    /**
     * Data source identifier (e.g., "USGS", "CWC", "LHASA", "AQICN").
     */
    @Column(length = 100)
    private String source;

    /**
     * External event ID from the source API — used for deduplication.
     * Example: USGS event ID "us7000n123"
     */
    @Column(name = "source_event_id", length = 255)
    private String sourceEventId;

    /**
     * Flexible JSONB metadata field for source-specific data.
     * Earthquake: {"magnitude": 6.2, "depth_km": 10, "felt_reports": 542}
     * Flood: {"water_level_m": 52.3, "trend": "RISING", "station": "GWHT"}
     * Air Quality: {"aqi": 312, "dominant_pollutant": "PM2.5"}
     */
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
