package com.prahari.inventory.entity;

import com.prahari.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Relief Camp entity — NGO/Government-managed relief facilities.
 * 
 * Each camp has a GPS location, capacity tracking, and is managed
 * by an NGO or Government user. The inventory system tracks supplies
 * and calculates deficits for logistics matching.
 * 
 * Table: {@code relief_camps}
 */
@Entity
@Table(name = "relief_camps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReliefCamp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 0;

    @Column(name = "current_occupancy")
    @Builder.Default
    private Integer currentOccupancy = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "managed_by")
    private User managedBy;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
