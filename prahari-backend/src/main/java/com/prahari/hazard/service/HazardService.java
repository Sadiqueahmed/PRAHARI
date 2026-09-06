package com.prahari.hazard.service;

import com.prahari.alert.service.AlertOrchestrator;
import com.prahari.hazard.dto.CreateHazardRequest;
import com.prahari.hazard.entity.HazardType;
import com.prahari.hazard.entity.HazardZone;
import com.prahari.hazard.entity.Severity;
import com.prahari.hazard.repository.HazardZoneRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing hazard zones.
 * 
 * When a new hazard zone is created, this service:
 *   1. Parses the geometry (GeoJSON polygon or center+radius circle)
 *   2. Checks for duplicate source events (deduplication)
 *   3. Persists the hazard zone to PostGIS
 *   4. Triggers the Alert Engine to notify affected users
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HazardService {

    private final HazardZoneRepository hazardZoneRepository;
    private final AlertOrchestrator alertOrchestrator;

    /**
     * Create a new hazard zone and trigger alerts to affected users.
     *
     * @param request Hazard zone creation details
     * @return The created hazard zone
     */
    @Transactional
    public HazardZone createHazardZone(CreateHazardRequest request) {
        // Deduplication: check if this source event already exists
        if (request.getSourceEventId() != null && !request.getSourceEventId().isBlank()) {
            var existing = hazardZoneRepository.findBySourceEventId(request.getSourceEventId());
            if (existing.isPresent()) {
                log.info("Hazard zone already exists for source event: {}", request.getSourceEventId());
                return existing.get();
            }
        }

        // Parse the geometry
        Geometry geometry = parseGeometry(request);

        // Parse enums
        HazardType hazardType = HazardType.valueOf(request.getHazardType().toUpperCase());
        Severity severity = Severity.valueOf(request.getSeverity().toUpperCase());

        // Build and save the hazard zone
        HazardZone hazardZone = HazardZone.builder()
                .hazardType(hazardType)
                .severity(severity)
                .title(request.getTitle())
                .description(request.getDescription())
                .geometry(geometry)
                .radiusKm(request.getRadiusKm())
                .source(request.getSource())
                .sourceEventId(request.getSourceEventId())
                .metadata(request.getMetadata())
                .startedAt(OffsetDateTime.parse(request.getStartedAt()))
                .expiresAt(request.getExpiresAt() != null
                        ? OffsetDateTime.parse(request.getExpiresAt()) : null)
                .build();

        HazardZone saved = hazardZoneRepository.save(hazardZone);
        log.info("Created hazard zone: {} [{}] severity={}", saved.getTitle(),
                saved.getHazardType(), saved.getSeverity());

        // Trigger the Alert Engine asynchronously
        // This finds all users within the hazard polygon and sends notifications
        alertOrchestrator.processNewHazardZone(saved);

        return saved;
    }

    /**
     * Get all currently active hazard zones.
     */
    public List<HazardZone> getActiveHazardZones() {
        return hazardZoneRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    /**
     * Get active hazard zones by type (for layer-specific map rendering).
     */
    public List<HazardZone> getActiveByType(HazardType type) {
        return hazardZoneRepository.findByHazardTypeAndIsActiveTrueOrderByCreatedAtDesc(type);
    }

    /**
     * Get hazard zones within a map viewport bounding box.
     */
    public List<HazardZone> getInBoundingBox(
            double minLon, double minLat, double maxLon, double maxLat) {
        return hazardZoneRepository.findActiveInBoundingBox(minLon, minLat, maxLon, maxLat);
    }

    /**
     * Get a hazard zone by ID.
     */
    public HazardZone getById(UUID id) {
        return hazardZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hazard zone not found: " + id));
    }

    /**
     * Deactivate a hazard zone (mark as expired).
     */
    @Transactional
    public HazardZone deactivate(UUID id) {
        HazardZone zone = getById(id);
        zone.setIsActive(false);
        zone.setExpiresAt(OffsetDateTime.now());
        log.info("Deactivated hazard zone: {}", zone.getTitle());
        return hazardZoneRepository.save(zone);
    }

    /**
     * Get active hazard zone count by type (for dashboard donut chart).
     */
    public List<Object[]> getActiveCountByType() {
        return hazardZoneRepository.countActiveByType();
    }

    // ====================================================================
    // Private Helpers
    // ====================================================================

    /**
     * Parse geometry from the request — supports GeoJSON or center+radius.
     */
    private Geometry parseGeometry(CreateHazardRequest request) {
        // Option 1: GeoJSON polygon provided directly
        if (request.getGeoJson() != null && !request.getGeoJson().isBlank()) {
            try {
                GeoJsonReader reader = new GeoJsonReader();
                Geometry geom = reader.read(request.getGeoJson());
                geom.setSRID(4326);
                return geom;
            } catch (ParseException e) {
                throw new IllegalArgumentException("Invalid GeoJSON geometry: " + e.getMessage());
            }
        }

        // Option 2: Center point + radius → create circular buffer
        if (request.getCenterLongitude() != null
                && request.getCenterLatitude() != null
                && request.getRadiusKm() != null) {
            return createCircularBuffer(
                    request.getCenterLongitude(),
                    request.getCenterLatitude(),
                    request.getRadiusKm());
        }

        throw new IllegalArgumentException(
                "Either geoJson or (centerLongitude, centerLatitude, radiusKm) must be provided");
    }

    /**
     * Create a circular buffer polygon from a center point and radius.
     * Uses a JTS buffer operation with enough points for a smooth circle.
     */
    private Geometry createCircularBuffer(double longitude, double latitude, double radiusKm) {
        // Convert km to approximate degrees (1 degree ≈ 111.32 km at equator)
        // This is an approximation; for production, use ST_Buffer with geography cast
        double radiusDegrees = radiusKm / 111.32;

        var point = com.prahari.common.util.GeometryUtil.createPoint(longitude, latitude);
        Geometry buffer = point.buffer(radiusDegrees, 64);  // 64 segments for smooth circle
        buffer.setSRID(4326);
        return buffer;
    }
}
