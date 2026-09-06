package com.prahari.hazard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new hazard zone.
 * 
 * Used by both:
 *   - Python ingestion services (POST /api/hazards from pollers)
 *   - Government users manually creating hazard zones from the dashboard
 * 
 * The geometry can be provided as:
 *   1. GeoJSON string (for polygons from external APIs like USGS)
 *   2. Center point + radius (for earthquake buffer circles)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateHazardRequest {

    @NotBlank(message = "Hazard type is required (FLOOD, EARTHQUAKE, LANDSLIDE, AIR_QUALITY)")
    private String hazardType;

    @NotBlank(message = "Severity is required (LOW, MEDIUM, HIGH, CRITICAL)")
    private String severity;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    /**
     * GeoJSON geometry string for the hazard polygon.
     * Example: {"type": "Polygon", "coordinates": [[[lon1,lat1], [lon2,lat2], ...]]}
     * 
     * Required if centerLongitude/centerLatitude/radiusKm are not provided.
     */
    private String geoJson;

    /**
     * Center longitude — used with radiusKm to create a circular buffer zone.
     * Alternative to providing a full GeoJSON polygon.
     */
    private Double centerLongitude;

    /** Center latitude */
    private Double centerLatitude;

    /** Radius in kilometers — creates a circular buffer polygon */
    private Double radiusKm;

    /** Data source identifier (e.g., "USGS", "CWC", "LHASA", "AQICN") */
    private String source;

    /** External event ID for deduplication (e.g., USGS event ID) */
    private String sourceEventId;

    /** Flexible JSON metadata string */
    private String metadata;

    /** When the hazard started (ISO 8601 timestamp) */
    @NotNull(message = "Start time is required")
    private String startedAt;

    /** When the hazard zone expires (ISO 8601 timestamp, optional) */
    private String expiresAt;
}
