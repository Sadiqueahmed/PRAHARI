package com.prahari.sos.service;

import com.prahari.common.util.GeometryUtil;
import com.prahari.hazard.entity.HazardZone;
import com.prahari.hazard.repository.HazardZoneRepository;
import com.prahari.sos.dto.CreateSOSRequest;
import com.prahari.sos.entity.SOSRequest;
import com.prahari.sos.repository.SOSRepository;
import com.prahari.user.entity.User;
import com.prahari.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for SOS panic button operations.
 * 
 * Flow:
 *   1. Citizen triggers SOS with GPS coordinates
 *   2. System checks if the location is inside any active hazard zone
 *   3. SOS is created and linked to the hazard zone (if any)
 *   4. NGO/Government users can acknowledge and resolve SOS requests
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SOSService {

    private final SOSRepository sosRepository;
    private final UserRepository userRepository;
    private final HazardZoneRepository hazardZoneRepository;

    /**
     * Create a new SOS request from the currently authenticated user.
     */
    @Transactional
    public SOSRequest createSOS(CreateSOSRequest request) {
        // Get the authenticated user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Create the location point
        Point location = GeometryUtil.createPoint(request.getLongitude(), request.getLatitude());

        // Check if this location is inside any active hazard zone
        List<HazardZone> hazardZones = hazardZoneRepository.findActiveZonesContainingPoint(
                request.getLongitude(), request.getLatitude());

        // Build the SOS request
        SOSRequest sos = SOSRequest.builder()
                .user(user)
                .location(location)
                .message(request.getMessage())
                .status("ACTIVE")
                .build();

        // Link to the most severe hazard zone if the SOS is inside one
        if (!hazardZones.isEmpty()) {
            sos.setHazardZone(hazardZones.get(0));  // Sorted by severity DESC
        }

        SOSRequest saved = sosRepository.save(sos);
        log.info("SOS created by user {} at [{}, {}]", user.getEmail(),
                request.getLongitude(), request.getLatitude());

        // Also update the user's last known location
        user.setLocation(location);
        userRepository.save(user);

        return saved;
    }

    /**
     * Get all active SOS requests (for NGO/Government dashboard).
     */
    public List<SOSRequest> getActiveSOS() {
        return sosRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }

    /**
     * Get active SOS count (for dashboard widget).
     */
    public long getActiveCount() {
        return sosRepository.countByStatus("ACTIVE");
    }

    /**
     * Get SOS coordinates for K-Means clustering (Government heatmap view).
     */
    public List<Object[]> getSOSCoordinates() {
        return sosRepository.getActiveSOSCoordinates();
    }

    /**
     * Acknowledge an SOS request (NGO/Government claims it).
     */
    @Transactional
    public SOSRequest acknowledgeSOS(UUID sosId) {
        SOSRequest sos = sosRepository.findById(sosId)
                .orElseThrow(() -> new EntityNotFoundException("SOS request not found: " + sosId));

        if (!"ACTIVE".equals(sos.getStatus())) {
            throw new IllegalArgumentException("SOS is not in ACTIVE status");
        }

        // Get the responder (authenticated user)
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User responder = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Responder not found"));

        sos.setStatus("ACKNOWLEDGED");
        sos.setResponder(responder);
        sos.setAcknowledgedAt(OffsetDateTime.now());

        log.info("SOS {} acknowledged by {}", sosId, responder.getEmail());
        return sosRepository.save(sos);
    }

    /**
     * Resolve an SOS request (emergency handled).
     */
    @Transactional
    public SOSRequest resolveSOS(UUID sosId) {
        SOSRequest sos = sosRepository.findById(sosId)
                .orElseThrow(() -> new EntityNotFoundException("SOS request not found: " + sosId));

        sos.setStatus("RESOLVED");
        sos.setResolvedAt(OffsetDateTime.now());

        log.info("SOS {} resolved", sosId);
        return sosRepository.save(sos);
    }
}
