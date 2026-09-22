package com.prahari.airquality.controller;

import com.prahari.airquality.dto.AirQualityDTO;
import com.prahari.airquality.service.AirQualityService;
import com.prahari.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Air Quality REST controller.
 *
 * Endpoints:
 *   GET /api/airquality/latest              — Latest AQI reading (any station)
 *   GET /api/airquality/stations            — Latest reading per station
 *   GET /api/airquality/station/:name       — Latest for a specific station
 *   GET /api/airquality/station/:name/history — Recent readings (time series)
 *   GET /api/airquality/alerts              — Stations above AQI threshold
 */
@RestController
@RequestMapping("/airquality")
@RequiredArgsConstructor
public class AirQualityController {

    private final AirQualityService airQualityService;

    /**
     * Get the most recent AQI reading across all stations.
     * Used by the frontend AirQualityCard widget.
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<AirQualityDTO>> getLatest() {
        AirQualityDTO latest = airQualityService.getLatestReading();
        if (latest == null) {
            return ResponseEntity.ok(ApiResponse.success("No AQI data available", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Latest AQI reading", latest));
    }

    /**
     * Get the latest reading for each monitoring station.
     */
    @GetMapping("/stations")
    public ResponseEntity<ApiResponse<List<AirQualityDTO>>> getLatestPerStation() {
        List<AirQualityDTO> readings = airQualityService.getLatestPerStation();
        return ResponseEntity.ok(ApiResponse.success("Latest AQI per station", readings));
    }

    /**
     * Get the latest reading for a specific station.
     */
    @GetMapping("/station/{stationName}")
    public ResponseEntity<ApiResponse<AirQualityDTO>> getForStation(
            @PathVariable String stationName) {
        AirQualityDTO reading = airQualityService.getLatestForStation(stationName);
        if (reading == null) {
            return ResponseEntity.ok(ApiResponse.success("No data for station: " + stationName, null));
        }
        return ResponseEntity.ok(ApiResponse.success("AQI for " + stationName, reading));
    }

    /**
     * Get recent readings for a station (time series data).
     */
    @GetMapping("/station/{stationName}/history")
    public ResponseEntity<ApiResponse<List<AirQualityDTO>>> getStationHistory(
            @PathVariable String stationName) {
        List<AirQualityDTO> readings = airQualityService.getRecentForStation(stationName);
        return ResponseEntity.ok(ApiResponse.success("AQI history for " + stationName, readings));
    }

    /**
     * Get stations where AQI exceeds a threshold (default: 150).
     * Used for generating alerts.
     */
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<AirQualityDTO>>> getAlerts(
            @RequestParam(defaultValue = "150") int threshold) {
        List<AirQualityDTO> alerts = airQualityService.getStationsAboveThreshold(threshold);
        return ResponseEntity.ok(ApiResponse.success("AQI alerts above " + threshold, alerts));
    }
}
