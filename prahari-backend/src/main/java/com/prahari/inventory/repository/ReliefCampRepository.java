package com.prahari.inventory.repository;

import com.prahari.inventory.entity.ReliefCamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for ReliefCamp entity.
 */
@Repository
public interface ReliefCampRepository extends JpaRepository<ReliefCamp, UUID> {

    List<ReliefCamp> findByIsActiveTrueOrderByNameAsc();

    /**
     * Find the nearest active relief camps to a given point.
     * Used by the SOS system to suggest the nearest safe shelter.
     * 
     * Uses PostGIS ST_Distance with geography cast for accurate Earth-surface distance.
     * 
     * @param longitude The reference point's longitude
     * @param latitude  The reference point's latitude
     * @param limit     Maximum number of camps to return
     */
    @Query(value = """
            SELECT rc.*, ST_Distance(
                rc.location::geography,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
            ) AS distance_meters
            FROM relief_camps rc
            WHERE rc.is_active = TRUE
            ORDER BY distance_meters ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<ReliefCamp> findNearestCamps(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("limit") int limit);
}
