package com.prahari.river.controller;

import com.prahari.common.dto.ApiResponse;
import com.prahari.river.dto.RiverStationDTO;
import com.prahari.river.entity.RiverReading;
import com.prahari.river.service.RiverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * River Monitoring Station REST controller.
 * 
 * Endpoints:
 *   GET /api/rivers/stations              — All stations with latest reading
 *   GET /api/rivers/stations/:id          — Single station detail
 *   GET /api/rivers/stations/:id/readings — Time-series readings for a station
 *   GET /api/rivers/alerts                — Stations above danger level
 * 
 * All endpoints require authentication (any role).
 */
@RestController
@RequestMapping("/rivers")
@RequiredArgsConstructor
public class RiverController {

    private final RiverService riverService;

    /**
     * Get all river stations with their latest reading.
     * Used by the dashboard River Levels bar chart and map markers.
     */
    @GetMapping("/stations")
    public ResponseEntity<ApiResponse<List<RiverStationDTO>>> getAllStations() {
        List<RiverStationDTO> stations = riverService.getAllStationsWithLatestReading();
        return ResponseEntity.ok(ApiResponse.success("River stations retrieved", stations));
    }

    /**
     * Get a single station with its latest reading.
     */
    @GetMapping("/stations/{id}")
    public ResponseEntity<ApiResponse<RiverStationDTO>> getStation(@PathVariable UUID id) {
        RiverStationDTO station = riverService.getStationById(id);
        return ResponseEntity.ok(ApiResponse.success("River station retrieved", station));
    }

    /**
     * Get time-series readings for a specific station.
     * Used for the station detail chart (click-through from bar chart).
     */
    @GetMapping("/stations/{id}/readings")
    public ResponseEntity<ApiResponse<List<RiverReading>>> getStationReadings(
            @PathVariable UUID id) {
        List<RiverReading> readings = riverService.getReadingsForStation(id);
        return ResponseEntity.ok(ApiResponse.success("Station readings retrieved", readings));
    }

    /**
     * Get stations where the latest reading is above danger level.
     * Used for the alert/warning panel in the dashboard.
     */
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<RiverStationDTO>>> getDangerAlerts() {
        List<RiverStationDTO> alerts = riverService.getStationsAboveDanger();
        return ResponseEntity.ok(ApiResponse.success("Danger alerts retrieved", alerts));
    }
}
