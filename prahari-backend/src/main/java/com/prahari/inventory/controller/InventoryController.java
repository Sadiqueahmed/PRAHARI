package com.prahari.inventory.controller;

import com.prahari.common.dto.ApiResponse;
import com.prahari.inventory.entity.InventoryItem;
import com.prahari.inventory.entity.ReliefCamp;
import com.prahari.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Inventory & Relief Camp REST controller.
 * 
 * Endpoints:
 *   GET  /api/inventory/camps           — List all active camps
 *   GET  /api/inventory/camps/:id       — Get camp details
 *   GET  /api/inventory/camps/nearest   — Find nearest camps to a point
 *   GET  /api/inventory/camps/:id/items — Get camp inventory
 *   PUT  /api/inventory/items/:id       — Update item quantity
 *   GET  /api/inventory/deficits        — Get all items in deficit
 *   GET  /api/inventory/surpluses       — Get all items with surplus
 * 
 * All endpoints require NGO+ role.
 */
@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('NGO', 'GOVERNMENT', 'SUPER_ADMIN')")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/camps")
    public ResponseEntity<ApiResponse<List<ReliefCamp>>> getAllCamps() {
        return ResponseEntity.ok(
                ApiResponse.success("Relief camps", inventoryService.getAllActiveCamps()));
    }

    @GetMapping("/camps/{id}")
    public ResponseEntity<ApiResponse<ReliefCamp>> getCamp(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.success("Relief camp", inventoryService.getCampById(id)));
    }

    /**
     * Find nearest relief camps to a location (for safe shelter routing).
     */
    @GetMapping("/camps/nearest")
    public ResponseEntity<ApiResponse<List<ReliefCamp>>> getNearestCamps(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "5") int limit) {
        List<ReliefCamp> camps = inventoryService.findNearestCamps(longitude, latitude, limit);
        return ResponseEntity.ok(ApiResponse.success("Nearest camps", camps));
    }

    @GetMapping("/camps/{campId}/items")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getCampInventory(
            @PathVariable UUID campId) {
        return ResponseEntity.ok(
                ApiResponse.success("Camp inventory", inventoryService.getInventoryByCamp(campId)));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<InventoryItem>> updateQuantity(
            @PathVariable UUID itemId,
            @RequestBody Map<String, Integer> body) {
        int newQuantity = body.getOrDefault("quantity", 0);
        InventoryItem updated = inventoryService.updateItemQuantity(itemId, newQuantity);
        return ResponseEntity.ok(ApiResponse.success("Quantity updated", updated));
    }

    @GetMapping("/deficits")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getDeficits() {
        return ResponseEntity.ok(
                ApiResponse.success("Items in deficit", inventoryService.getAllDeficits()));
    }

    @GetMapping("/surpluses")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getSurpluses() {
        return ResponseEntity.ok(
                ApiResponse.success("Items with surplus", inventoryService.getAllSurpluses()));
    }
}
