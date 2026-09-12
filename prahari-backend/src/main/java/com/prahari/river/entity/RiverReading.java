package com.prahari.river.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * River Reading entity — time-series water level data.
 * Ingested by the CWC scraper every 15 minutes during monsoon.
 * 
 * Table: {@code river_readings}
 */
@Entity
@Table(name = "river_readings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiverReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private RiverStation station;

    @Column(name = "water_level", nullable = false)
    private Double waterLevel;

    @Column(name = "flow_rate")
    private Double flowRate;

    @Column(length = 10)
    private String trend;

    @Column(name = "reading_time", nullable = false)
    private OffsetDateTime readingTime;

    @Builder.Default
    @Column(name = "is_above_danger")
    private Boolean isAboveDanger = false;

    @Builder.Default
    @Column(name = "is_above_warning")
    private Boolean isAboveWarning = false;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
