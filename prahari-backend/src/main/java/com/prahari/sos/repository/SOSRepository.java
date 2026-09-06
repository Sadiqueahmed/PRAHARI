package com.prahari.sos.repository;

import com.prahari.sos.entity.SOSRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for SOS Request entity.
 */
@Repository
public interface SOSRepository extends JpaRepository<SOSRequest, UUID> {

    /**
     * Find all active (unresolved) SOS requests.
     */
    List<SOSRequest> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * Find all SOS requests by a specific user.
     */
    List<SOSRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Count active SOS requests (for the dashboard widget).
     */
    long countByStatus(String status);

    /**
     * Find active SOS requests within a bounding box (for map rendering).
     */
    @Query(value = """
            SELECT s.* FROM sos_requests s
            WHERE s.status = 'ACTIVE'
              AND ST_Within(
                  s.location,
                  ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)
              )
            ORDER BY s.created_at DESC
            """, nativeQuery = true)
    List<SOSRequest> findActiveInBoundingBox(
            @Param("minLon") double minLon,
            @Param("minLat") double minLat,
            @Param("maxLon") double maxLon,
            @Param("maxLat") double maxLat);

    /**
     * Get SOS location data for K-Means clustering (Government heatmap view).
     * Returns only coordinates of active SOS requests.
     */
    @Query(value = """
            SELECT ST_X(s.location) AS longitude, ST_Y(s.location) AS latitude
            FROM sos_requests s
            WHERE s.status = 'ACTIVE'
            """, nativeQuery = true)
    List<Object[]> getActiveSOSCoordinates();
}
