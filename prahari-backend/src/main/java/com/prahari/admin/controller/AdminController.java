package com.prahari.admin.controller;

import com.prahari.alert.entity.AlertLog;
import com.prahari.alert.repository.AlertLogRepository;
import com.prahari.common.dto.ApiResponse;
import com.prahari.user.dto.AdminUpdateUserRequest;
import com.prahari.user.dto.UserDTO;
import com.prahari.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Admin REST controller — SUPER_ADMIN only endpoints.
 * 
 * Endpoints:
 *   GET    /api/admin/users              — List all users
 *   GET    /api/admin/users/:id          — Get user by ID
 *   PUT    /api/admin/users/:id          — Update user (role, active, etc.)
 *   PUT    /api/admin/users/:id/deactivate — Deactivate user
 *   PUT    /api/admin/users/:id/reactivate — Reactivate user
 *   GET    /api/admin/stats              — Dashboard statistics
 *   GET    /api/admin/alerts             — Alert log history
 *   GET    /api/admin/alerts/stats       — Alert statistics
 * 
 * All endpoints are protected by @PreAuthorize("hasAuthority('SUPER_ADMIN')") 
 * and the SecurityConfig rule for /admin/**.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AlertLogRepository alertLogRepository;

    // ================================================================
    // User Management
    // ================================================================

    /**
     * List all users in the platform.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> listUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    /**
     * Get a specific user by ID.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUser(@PathVariable UUID id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved", user));
    }

    /**
     * Update a user's details (role, active status, profile fields).
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        UserDTO updated = userService.adminUpdateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated", updated));
    }

    /**
     * Deactivate a user account.
     */
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated"));
    }

    /**
     * Reactivate a user account.
     */
    @PutMapping("/users/{id}/reactivate")
    public ResponseEntity<ApiResponse<Void>> reactivateUser(@PathVariable UUID id) {
        userService.reactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User reactivated"));
    }

    // ================================================================
    // Dashboard Statistics
    // ================================================================

    /**
     * Get platform statistics for the admin dashboard.
     * Returns user counts, role distribution, and alert metrics.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> userStats = userService.getUserStatistics();

        // Add alert statistics
        long totalAlerts = alertLogRepository.count();
        long sentAlerts = alertLogRepository.findAll().stream()
                .filter(a -> "SENT".equals(a.getStatus()) || "DELIVERED".equals(a.getStatus()))
                .count();
        long failedAlerts = alertLogRepository.findAll().stream()
                .filter(a -> "FAILED".equals(a.getStatus()))
                .count();

        userStats = new java.util.HashMap<>(userStats);
        userStats.put("totalAlerts", totalAlerts);
        userStats.put("sentAlerts", sentAlerts);
        userStats.put("failedAlerts", failedAlerts);

        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics", userStats));
    }

    // ================================================================
    // Alert Log History
    // ================================================================

    /**
     * Get all alert logs, sorted by most recent first.
     */
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<AlertLog>>> getAlertLogs() {
        List<AlertLog> logs = alertLogRepository.findAll(
                Sort.by(Sort.Direction.DESC, "attemptedAt"));
        return ResponseEntity.ok(ApiResponse.success("Alert logs retrieved", logs));
    }

    /**
     * Get alert statistics: total, sent, failed, by channel.
     */
    @GetMapping("/alerts/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAlertStats() {
        List<AlertLog> all = alertLogRepository.findAll();

        Map<String, Long> byChannel = all.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        AlertLog::getChannel, java.util.stream.Collectors.counting()));

        Map<String, Long> byStatus = all.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        AlertLog::getStatus, java.util.stream.Collectors.counting()));

        Map<String, Object> stats = Map.of(
                "total", (long) all.size(),
                "byChannel", byChannel,
                "byStatus", byStatus
        );

        return ResponseEntity.ok(ApiResponse.success("Alert statistics", stats));
    }
}
