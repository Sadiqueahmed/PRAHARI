package com.prahari.river.repository;

import com.prahari.river.entity.RiverReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for RiverReading time-series data.
 */
@Repository
public interface RiverReadingRepository extends JpaRepository<RiverReading, UUID> {

    /**
     * Get the latest reading for each station — used for dashboard display.
     */
    @Query(value = """
            SELECT DISTINCT ON (r.station_id) r.*
            FROM river_readings r
            ORDER BY r.station_id, r.reading_time DESC
            """, nativeQuery = true)
    List<RiverReading> findLatestReadingPerStation();

    /**
     * Get latest reading for a specific station.
     */
    @Query(value = """
            SELECT r.* FROM river_readings r
            WHERE r.station_id = :stationId
            ORDER BY r.reading_time DESC
            LIMIT 1
            """, nativeQuery = true)
    RiverReading findLatestByStationId(@Param("stationId") UUID stationId);

    /**
     * Get readings above danger level — for alerts.
     */
    @Query(value = """
            SELECT r.* FROM river_readings r
            WHERE r.is_above_danger = TRUE
            ORDER BY r.reading_time DESC
            LIMIT 20
            """, nativeQuery = true)
    List<RiverReading> findAboveDangerLevel();

    /**
     * Get recent readings for a specific station (time-series chart).
     */
    List<RiverReading> findByStationIdOrderByReadingTimeDesc(UUID stationId);
}
