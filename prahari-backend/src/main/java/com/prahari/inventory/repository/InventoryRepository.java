package com.prahari.inventory.repository;

import com.prahari.inventory.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for InventoryItem entity.
 */
@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, UUID> {

    /**
     * Find all inventory items for a specific camp.
     */
    List<InventoryItem> findByCampIdOrderByCategoryAscItemNameAsc(UUID campId);

    /**
     * Find items in deficit across all camps (quantity < minimum_required).
     * Used by the NGO logistics matching view.
     */
    @Query(value = """
            SELECT i.* FROM inventory_items i
            JOIN relief_camps rc ON i.camp_id = rc.id
            WHERE rc.is_active = TRUE
              AND i.quantity < i.minimum_required
            ORDER BY (i.minimum_required - i.quantity) DESC
            """, nativeQuery = true)
    List<InventoryItem> findAllDeficits();

    /**
     * Find items with surplus across all camps (quantity > minimum_required).
     * Used for cross-camp logistics matching.
     */
    @Query(value = """
            SELECT i.* FROM inventory_items i
            JOIN relief_camps rc ON i.camp_id = rc.id
            WHERE rc.is_active = TRUE
              AND i.quantity > i.minimum_required
            ORDER BY (i.quantity - i.minimum_required) DESC
            """, nativeQuery = true)
    List<InventoryItem> findAllSurpluses();
}
