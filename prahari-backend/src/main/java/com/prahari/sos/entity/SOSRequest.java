package com.prahari.sos.entity;

import com.prahari.user.entity.User;
import com.prahari.hazard.entity.HazardZone;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * SOS Request entity — Citizen panic button requests.
 * 
 * Each SOS request captures:
 *   - The user's GPS location at the time of the emergency
 *   - An optional message describing the situation
 *   - Status lifecycle: ACTIVE → ACKNOWLEDGED → RESOLVED
 *   - Optional link to the hazard zone causing the emergency
 *   - The responder (NGO/Government user) who claimed the SOS
 * 
 * Government view uses K-Means clustering on SOS locations to
 * generate heatmaps for command-level situational awareness.
 * 
 * Table: {@code sos_requests}
 */
@Entity
@Table(name = "sos_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SOSRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * GPS location at the time the SOS was triggered.
     * Captured via browser Geolocation API on the frontend.
     */
    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    @Column(columnDefinition = "TEXT")
    private String message;

    /**
     * SOS lifecycle status.
     * ACTIVE: Just triggered, awaiting response.
     * ACKNOWLEDGED: A responder has claimed this SOS.
     * RESOLVED: The emergency has been handled.
     * EXPIRED: Auto-expired after timeout with no acknowledgment.
     */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_zone_id")
    private HazardZone hazardZone;

    /**
     * The NGO or Government user who claimed/acknowledged this SOS.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id")
    private User responder;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
