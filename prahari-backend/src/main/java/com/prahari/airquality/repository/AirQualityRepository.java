package com.prahari.airquality.repository;

import com.prahari.airquality.entity.AirQualityReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Air Quality readings.
 */
@Repository
public interface AirQualityRepository extends JpaRepository<AirQualityReading, UUID> {

    /**
     * Get the most recent reading for a specific station.
     */
    Optional<AirQualityReading> findTopByStationNameOrderByReadingTimeDesc(String stationName);

    /**
     * Get the most recent reading across all stations.
     */
    Optional<AirQualityReading> findTopByOrderByReadingTimeDesc();

    /**
     * Get the latest reading for each station (one per station).
     * Uses a subquery to find the max reading_time per station.
     */
    @Query(value = """
            SELECT aq.* FROM air_quality_readings aq
            INNER JOIN (
                SELECT station_name, MAX(reading_time) AS max_time
                FROM air_quality_readings
                GROUP BY station_name
            ) latest ON aq.station_name = latest.station_name
                     AND aq.reading_time = latest.max_time
            ORDER BY aq.aqi DESC
            """, nativeQuery = true)
    List<AirQualityReading> findLatestPerStation();

    /**
     * Get recent readings for a station (time series for charts).
     */
    List<AirQualityReading> findTop24ByStationNameOrderByReadingTimeDesc(String stationName);

    /**
     * Find stations where AQI exceeds a threshold.
     */
    @Query(value = """
            SELECT aq.* FROM air_quality_readings aq
            INNER JOIN (
                SELECT station_name, MAX(reading_time) AS max_time
                FROM air_quality_readings
                GROUP BY station_name
            ) latest ON aq.station_name = latest.station_name
                     AND aq.reading_time = latest.max_time
            WHERE aq.aqi > :threshold
            ORDER BY aq.aqi DESC
            """, nativeQuery = true)
    List<AirQualityReading> findStationsAboveThreshold(@Param("threshold") int threshold);
}
