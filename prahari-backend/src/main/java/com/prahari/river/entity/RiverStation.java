package com.prahari.river.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * River Station entity — CWC river monitoring stations.
 * 
 * Each station tracks water levels on a specific river and has
 * predefined danger/warning thresholds for flood alerts.
 * 
 * Table: {@code river_stations}
 */
@Entity
@Table(name = "river_stations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiverStation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "station_code", unique = true, nullable = false, length = 50)
    private String stationCode;

    @Column(name = "station_name", nullable = false)
    private String stationName;

    @Column(name = "river_name", nullable = false, length = 100)
    private String riverName;

    @Column(length = 100)
    private String basin;

    @Column(length = 50)
    private String state;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    @Column(name = "danger_level")
    private Double dangerLevel;

    @Column(name = "warning_level")
    private Double warningLevel;

    @Column(name = "highest_flood_level")
    private Double highestFloodLevel;

    @Column(name = "zero_gauge_rl")
    private Double zeroGaugeRl;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
