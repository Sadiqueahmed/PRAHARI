package com.prahari.hazard.controller;

import com.prahari.common.dto.ApiResponse;
import com.prahari.hazard.dto.CreateHazardRequest;
import com.prahari.hazard.entity.HazardType;
import com.prahari.hazard.entity.HazardZone;
import com.prahari.hazard.service.HazardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Hazard Zone REST controller.
 * 
 * Endpoints:
 *   GET  /api/hazards              — List all active hazard zones
 *   GET  /api/hazards/:id          — Get a specific hazard zone
 *   GET  /api/hazards/type/:type   — Get hazard zones by type
 *   GET  /api/hazards/bbox         — Get hazard zones in map viewport
 *   GET  /api/hazards/summary      — Get active counts by type (dashboard)
 *   POST /api/hazards              — Create a new hazard zone (GOVERNMENT+)
 *   PUT  /api/hazards/:id/deactivate — Deactivate a hazard zone (GOVERNMENT+)
 */
@RestController
@RequestMapping("/hazards")
@RequiredArgsConstructor
public class HazardController {

    private final HazardService hazardService;

    /**
     * List all currently active hazard zones.
     * Accessible by all authenticated users.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<HazardZone>>> getActiveHazards() {
        List<HazardZone> zones = hazardService.getActiveHazardZones();
        return ResponseEntity.ok(ApiResponse.success("Active hazard zones retrieved", zones));
    }

    /**
     * Get a specific hazard zone by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HazardZone>> getById(@PathVariable UUID id) {
        HazardZone zone = hazardService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Hazard zone retrieved", zone));
    }

    /**
     * Get active hazard zones filtered by type.
     * Used by the frontend to load data for specific map layers.
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<HazardZone>>> getByType(
            @PathVariable String type) {
        HazardType hazardType = HazardType.valueOf(type.toUpperCase());
        List<HazardZone> zones = hazardService.getActiveByType(hazardType);
        return ResponseEntity.ok(ApiResponse.success("Hazard zones by type", zones));
    }

    /**
     * Get hazard zones within a map viewport bounding box.
     * Called by the frontend when the user pans/zooms the map.
     */
    @GetMapping("/bbox")
    public ResponseEntity<ApiResponse<List<HazardZone>>> getInBoundingBox(
            @RequestParam double minLon,
            @RequestParam double minLat,
            @RequestParam double maxLon,
            @RequestParam double maxLat) {
        List<HazardZone> zones = hazardService.getInBoundingBox(minLon, minLat, maxLon, maxLat);
        return ResponseEntity.ok(ApiResponse.success("Hazard zones in viewport", zones));
    }

    /**
     * Get active hazard zone count by type (for the dashboard donut chart).
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<Object[]>>> getSummary() {
        List<Object[]> summary = hazardService.getActiveCountByType();
        return ResponseEntity.ok(ApiResponse.success("Hazard zone summary", summary));
    }

    /**
     * Create a new hazard zone.
     * Restricted to GOVERNMENT and SUPER_ADMIN roles.
     * Also called by Python ingestion services (authenticated via service account).
     * 
     * This endpoint triggers the Alert Engine to notify affected users.
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('GOVERNMENT', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HazardZone>> createHazard(
            @Valid @RequestBody CreateHazardRequest request) {
        HazardZone zone = hazardService.createHazardZone(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Hazard zone created", zone));
    }

    /**
     * Deactivate (expire) a hazard zone.
     */
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyAuthority('GOVERNMENT', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HazardZone>> deactivate(@PathVariable UUID id) {
        HazardZone zone = hazardService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Hazard zone deactivated", zone));
    }
}
