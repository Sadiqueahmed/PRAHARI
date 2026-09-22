package com.prahari.airquality.dto;

import lombok.*;

/**
 * DTO for air quality reading responses.
 * Flattens the PostGIS Point into lon/lat for frontend consumption.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AirQualityDTO {
    private String id;
    private String stationName;
    private double longitude;
    private double latitude;
    private int aqi;
    private String dominantPollutant;
    private Double pm25;
    private Double pm10;
    private Double o3;
    private Double no2;
    private Double co;
    private Double so2;
    private String readingTime;
    private String aqiCategory;

    /**
     * Human-readable AQI category.
     */
    public static String categorize(int aqi) {
        if (aqi <= 50)  return "Good";
        if (aqi <= 100) return "Moderate";
        if (aqi <= 150) return "Unhealthy for Sensitive Groups";
        if (aqi <= 200) return "Unhealthy";
        if (aqi <= 300) return "Very Unhealthy";
        return "Hazardous";
    }
}
