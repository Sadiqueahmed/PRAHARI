package com.prahari.river.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for river station data with its latest reading.
 * Used by the frontend for the river level bar chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiverStationDTO {
    private String id;
    private String stationCode;
    private String stationName;
    private String riverName;
    private String basin;
    private String state;
    private Double longitude;
    private Double latitude;
    private Double dangerLevel;
    private Double warningLevel;
    private Double highestFloodLevel;

    // Latest reading data (may be null if no readings exist)
    private Double currentLevel;
    private Double flowRate;
    private String trend;
    private String readingTime;
    private Boolean isAboveDanger;
    private Boolean isAboveWarning;
}
