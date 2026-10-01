package com.prahari.user.service;

import com.prahari.common.util.GeometryUtil;
import com.prahari.user.dto.AdminUpdateUserRequest;
import com.prahari.user.dto.UpdateProfileRequest;
import com.prahari.user.dto.UserDTO;
import com.prahari.user.entity.Role;
import com.prahari.user.entity.User;
import com.prahari.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User management service — CRUD operations for admin and profile management.
 * 
 * Provides:
 *   - List/search users (admin)
 *   - Get user by ID (admin)
 *   - Update user profile (self)
 *   - Admin update user (role, active status, etc.)
 *   - Deactivate/reactivate user (admin)
 *   - User statistics (admin dashboard)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Convert User entity to UserDTO.
     */
    private UserDTO toDTO(User user) {
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .whatsappId(user.getWhatsappId())
                .role(user.getRole().name())
                .organization(user.getOrganization())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        // Extract longitude/latitude from PostGIS Point if present
        if (user.getLocation() != null) {
            builder.longitude(user.getLocation().getX());
            builder.latitude(user.getLocation().getY());
        }

        return builder.build();
    }

    /**
     * Get all users (admin only).
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific user by ID.
     */
    public UserDTO getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        return toDTO(user);
    }

    /**
     * Get a user by email.
     */
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        return toDTO(user);
    }

    /**
     * Update the current user's own profile.
     */
    @Transactional
    public UserDTO updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getWhatsappId() != null) user.setWhatsappId(request.getWhatsappId());
        if (request.getOrganization() != null) user.setOrganization(request.getOrganization());

        // Update location if both coordinates are provided
        if (request.getLongitude() != null && request.getLatitude() != null) {
            user.setLocation(GeometryUtil.createPoint(
                    request.getLongitude(), request.getLatitude()));
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", email);
        return toDTO(saved);
    }

    /**
     * Admin: Update any user's details (including role and active status).
     */
    @Transactional
    public UserDTO adminUpdateUser(UUID userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getWhatsappId() != null) user.setWhatsappId(request.getWhatsappId());
        if (request.getOrganization() != null) user.setOrganization(request.getOrganization());
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());

        if (request.getRole() != null) {
            try {
                user.setRole(Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + request.getRole()
                        + ". Valid roles: CITIZEN, NGO, GOVERNMENT, SUPER_ADMIN");
            }
        }

        User saved = userRepository.save(user);
        log.info("Admin updated user {}: role={}, active={}", userId, saved.getRole(), saved.getIsActive());
        return toDTO(saved);
    }

    /**
     * Admin: Deactivate a user account.
     */
    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getEmail());
    }

    /**
     * Admin: Reactivate a user account.
     */
    @Transactional
    public void reactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User reactivated: {}", user.getEmail());
    }

    /**
     * Get user statistics for the admin dashboard.
     * Returns counts per role and total active/inactive users.
     */
    public Map<String, Object> getUserStatistics() {
        List<User> allUsers = userRepository.findAll();

        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream().filter(User::getIsActive).count();
        long inactiveUsers = totalUsers - activeUsers;

        Map<String, Long> roleDistribution = allUsers.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));

        return Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "inactiveUsers", inactiveUsers,
                "roleDistribution", roleDistribution
        );
    }
}
