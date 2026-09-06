package com.prahari.hazard.repository;

import com.prahari.hazard.entity.HazardType;
import com.prahari.hazard.entity.HazardZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for HazardZone entity with PostGIS spatial queries.
 * 
 * Provides spatial operations critical for:
 *   1. The Alert Engine (find users in hazard zones)
 *   2. The frontend map (find hazard zones visible in viewport)
 *   3. Deduplication (check if a hazard from an external source already exists)
 */
@Repository
public interface HazardZoneRepository extends JpaRepository<HazardZone, UUID> {

    /**
     * Find all currently active hazard zones.
     */
    List<HazardZone> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Find active hazard zones by type (for layer-specific rendering).
     */
    List<HazardZone> findByHazardTypeAndIsActiveTrueOrderByCreatedAtDesc(HazardType type);

    /**
     * Check if a hazard zone from an external source already exists (deduplication).
     */
    Optional<HazardZone> findBySourceEventId(String sourceEventId);

    /**
     * Find all active hazard zones that intersect with a given bounding box.
     * Used by the frontend to load only hazard zones visible in the current map viewport.
     * 
     * @param minLon Minimum longitude (west)
     * @param minLat Minimum latitude (south)
     * @param maxLon Maximum longitude (east)
     * @param maxLat Maximum latitude (north)
     */
    @Query(value = """
            SELECT hz.* FROM hazard_zones hz
            WHERE hz.is_active = TRUE
              AND ST_Intersects(
                  hz.geometry,
                  ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)
              )
            ORDER BY hz.created_at DESC
            """, nativeQuery = true)
    List<HazardZone> findActiveInBoundingBox(
            @Param("minLon") double minLon,
            @Param("minLat") double minLat,
            @Param("maxLon") double maxLon,
            @Param("maxLat") double maxLat);

    /**
     * Find active hazard zones that contain a specific point.
     * Used to check if a location is currently inside any hazard zone.
     * 
     * @param longitude The point's longitude
     * @param latitude  The point's latitude
     */
    @Query(value = """
            SELECT hz.* FROM hazard_zones hz
            WHERE hz.is_active = TRUE
              AND ST_Within(
                  ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                  hz.geometry
              )
            ORDER BY hz.severity DESC
            """, nativeQuery = true)
    List<HazardZone> findActiveZonesContainingPoint(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude);

    /**
     * Count active hazard zones grouped by type.
     * Used for the dashboard summary widget.
     */
    @Query(value = """
            SELECT hz.hazard_type AS type, COUNT(*) AS count
            FROM hazard_zones hz
            WHERE hz.is_active = TRUE
            GROUP BY hz.hazard_type
            """, nativeQuery = true)
    List<Object[]> countActiveByType();
}
