package com.prahari.sos.controller;

import com.prahari.common.dto.ApiResponse;
import com.prahari.sos.dto.CreateSOSRequest;
import com.prahari.sos.entity.SOSRequest;
import com.prahari.sos.service.SOSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * SOS Panic Button REST controller.
 * 
 * Endpoints:
 *   POST /api/sos                    — Create SOS (any authenticated user)
 *   GET  /api/sos/active             — List active SOS requests (NGO+)
 *   GET  /api/sos/count              — Active SOS count (dashboard widget)
 *   GET  /api/sos/coordinates        — SOS coordinates for heatmap (GOVERNMENT+)
 *   PUT  /api/sos/:id/acknowledge    — Claim an SOS (NGO+)
 *   PUT  /api/sos/:id/resolve        — Resolve an SOS (NGO+)
 */
@RestController
@RequestMapping("/sos")
@RequiredArgsConstructor
public class SOSController {

    private final SOSService sosService;

    /**
     * Trigger an SOS panic button request.
     * Any authenticated user can create an SOS.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SOSRequest>> createSOS(
            @Valid @RequestBody CreateSOSRequest request) {
        SOSRequest sos = sosService.createSOS(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("SOS request created", sos));
    }

    /**
     * List all active (unresolved) SOS requests.
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('NGO', 'GOVERNMENT', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<SOSRequest>>> getActiveSOS() {
        List<SOSRequest> active = sosService.getActiveSOS();
        return ResponseEntity.ok(ApiResponse.success("Active SOS requests", active));
    }

    /**
     * Get active SOS count (for the dashboard widget).
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getActiveCount() {
        long count = sosService.getActiveCount();
        return ResponseEntity.ok(ApiResponse.success("Active SOS count",
                Map.of("activeCount", count)));
    }

    /**
     * Get SOS coordinates for K-Means clustering heatmap.
     * Government Command View only.
     */
    @GetMapping("/coordinates")
    @PreAuthorize("hasAnyAuthority('GOVERNMENT', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<Object[]>>> getCoordinates() {
        List<Object[]> coords = sosService.getSOSCoordinates();
        return ResponseEntity.ok(ApiResponse.success("SOS coordinates", coords));
    }

    /**
     * Acknowledge (claim) an SOS request.
     */
    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyAuthority('NGO', 'GOVERNMENT', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SOSRequest>> acknowledge(@PathVariable UUID id) {
        SOSRequest sos = sosService.acknowledgeSOS(id);
        return ResponseEntity.ok(ApiResponse.success("SOS acknowledged", sos));
    }

    /**
     * Resolve an SOS request.
     */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyAuthority('NGO', 'GOVERNMENT', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SOSRequest>> resolve(@PathVariable UUID id) {
        SOSRequest sos = sosService.resolveSOS(id);
        return ResponseEntity.ok(ApiResponse.success("SOS resolved", sos));
    }
}
