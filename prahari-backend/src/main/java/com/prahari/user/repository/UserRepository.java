package com.prahari.user.repository;

import com.prahari.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity with PostGIS spatial queries.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Find all active users whose location falls within a hazard zone polygon.
     * 
     * This is the core spatial query used by the Alert Engine.
     * Uses PostGIS ST_Within to perform a point-in-polygon test.
     * 
     * @param hazardZoneId The UUID of the hazard zone to check against
     * @return List of users within the hazard zone's geometry
     */
    @Query(value = """
            SELECT u.* FROM users u
            JOIN hazard_zones hz ON ST_Within(u.location, hz.geometry)
            WHERE hz.id = :hazardZoneId
              AND hz.is_active = TRUE
              AND u.is_active = TRUE
              AND u.location IS NOT NULL
            """, nativeQuery = true)
    List<User> findUsersWithinHazardZone(@Param("hazardZoneId") UUID hazardZoneId);

    /**
     * Find all active users within a given radius (in meters) of a point.
     * 
     * Uses PostGIS ST_DWithin with geography cast for accurate distance on Earth.
     * 
     * @param longitude Center longitude
     * @param latitude  Center latitude
     * @param radiusMeters Radius in meters
     * @return List of users within the radius
     */
    @Query(value = """
            SELECT u.* FROM users u
            WHERE u.is_active = TRUE
              AND u.location IS NOT NULL
              AND ST_DWithin(
                  u.location::geography,
                  ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                  :radiusMeters
              )
            """, nativeQuery = true)
    List<User> findUsersWithinRadius(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radiusMeters") double radiusMeters);
}
