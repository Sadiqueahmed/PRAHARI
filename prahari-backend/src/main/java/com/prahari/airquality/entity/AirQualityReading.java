package com.prahari.airquality.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Air Quality Reading entity — maps to the air_quality_readings table.
 *
 * Stores AQICN air quality index snapshots for NE India region.
 * Each reading is tied to a monitoring station with GPS coordinates.
 */
@Entity
@Table(name = "air_quality_readings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AirQualityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "station_name", nullable = false)
    private String stationName;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    @Column(nullable = false)
    private Integer aqi;

    @Column(name = "dominant_pollutant")
    private String dominantPollutant;

    private Double pm25;
    private Double pm10;
    private Double o3;
    private Double no2;
    private Double co;
    private Double so2;

    @Column(name = "reading_time", nullable = false)
    private OffsetDateTime readingTime;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
