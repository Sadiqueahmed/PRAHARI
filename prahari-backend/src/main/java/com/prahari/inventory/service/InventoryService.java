package com.prahari.inventory.service;

import com.prahari.inventory.entity.InventoryItem;
import com.prahari.inventory.entity.ReliefCamp;
import com.prahari.inventory.repository.InventoryRepository;
import com.prahari.inventory.repository.ReliefCampRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for relief camp inventory management.
 * 
 * Key operations:
 *   - CRUD for relief camps and their inventory items
 *   - Deficit detection (items below minimum stock levels)
 *   - Surplus detection (for cross-camp logistics matching)
 *   - Nearest camp lookup (for SOS safe shelter routing)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ReliefCampRepository campRepository;
    private final InventoryRepository inventoryRepository;

    // ====================================================================
    // Relief Camp Operations
    // ====================================================================

    public List<ReliefCamp> getAllActiveCamps() {
        return campRepository.findByIsActiveTrueOrderByNameAsc();
    }

    public ReliefCamp getCampById(UUID id) {
        return campRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Relief camp not found: " + id));
    }

    @Transactional
    public ReliefCamp createCamp(ReliefCamp camp) {
        ReliefCamp saved = campRepository.save(camp);
        log.info("Created relief camp: {}", saved.getName());
        return saved;
    }

    /**
     * Find the nearest relief camps to a given location.
     * Used by the SOS system to suggest safe shelters.
     */
    public List<ReliefCamp> findNearestCamps(double longitude, double latitude, int limit) {
        return campRepository.findNearestCamps(longitude, latitude, limit);
    }

    // ====================================================================
    // Inventory Operations
    // ====================================================================

    public List<InventoryItem> getInventoryByCamp(UUID campId) {
        return inventoryRepository.findByCampIdOrderByCategoryAscItemNameAsc(campId);
    }

    @Transactional
    public InventoryItem updateItemQuantity(UUID itemId, int newQuantity) {
        InventoryItem item = inventoryRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Inventory item not found: " + itemId));
        item.setQuantity(newQuantity);
        log.info("Updated inventory item {} quantity to {}", item.getItemName(), newQuantity);
        return inventoryRepository.save(item);
    }

    /**
     * Get all items in deficit across all active camps.
     * Used by the NGO logistics matching view.
     */
    public List<InventoryItem> getAllDeficits() {
        return inventoryRepository.findAllDeficits();
    }

    /**
     * Get all items with surplus across all active camps.
     * Used for cross-camp logistics matching.
     */
    public List<InventoryItem> getAllSurpluses() {
        return inventoryRepository.findAllSurpluses();
    }
}
