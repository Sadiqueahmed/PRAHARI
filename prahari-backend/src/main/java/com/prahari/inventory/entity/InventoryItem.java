package com.prahari.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Inventory Item entity — supplies tracked at each relief camp.
 * 
 * The deficit is calculated as: {@code minimum_required - quantity}.
 * Positive deficit = camp needs more supplies.
 * Negative deficit = camp has surplus (can share with other camps).
 * 
 * NGOs can view deficits across all camps and claim them for fulfillment.
 * 
 * Table: {@code inventory_items}
 */
@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camp_id", nullable = false)
    private ReliefCamp camp;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    /**
     * Supply category for grouping and filtering.
     * Values: FOOD, WATER, MEDICAL, SHELTER, CLOTHING, HYGIENE, OTHER
     */
    @Column(length = 50)
    private String category;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(length = 20)
    @Builder.Default
    private String unit = "units";

    /**
     * Minimum required stock level.
     * If quantity < minimumRequired, this item is in deficit.
     */
    @Column(name = "minimum_required")
    @Builder.Default
    private Integer minimumRequired = 0;

    @Builder.Default
    @Column(name = "last_updated", nullable = false)
    private OffsetDateTime lastUpdated = OffsetDateTime.now();

    /**
     * Calculate the current deficit (positive = needs, negative = surplus).
     */
    @Transient
    public int getDeficit() {
        return (minimumRequired != null ? minimumRequired : 0) - (quantity != null ? quantity : 0);
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = OffsetDateTime.now();
    }
}
