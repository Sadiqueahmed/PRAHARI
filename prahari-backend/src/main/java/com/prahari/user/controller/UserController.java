package com.prahari.user.controller;

import com.prahari.common.dto.ApiResponse;
import com.prahari.user.dto.UpdateProfileRequest;
import com.prahari.user.dto.UserDTO;
import com.prahari.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * User Profile REST controller.
 * 
 * Endpoints (all require valid JWT):
 *   GET  /api/users/me          — Get current user's profile
 *   PUT  /api/users/me          — Update current user's profile
 *   PUT  /api/users/me/location — Update current user's GPS location
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get the current authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getMyProfile(Authentication authentication) {
        UserDTO user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", user));
    }

    /**
     * Update the current user's profile (name, phone, organization, etc.).
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDTO updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", updated));
    }

    /**
     * Quick endpoint to update just the user's GPS location.
     * Called by the SOS button to save last known position.
     */
    @PutMapping("/me/location")
    public ResponseEntity<ApiResponse<UserDTO>> updateMyLocation(
            Authentication authentication,
            @RequestParam double longitude,
            @RequestParam double latitude) {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setLongitude(longitude);
        request.setLatitude(latitude);
        UserDTO updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Location updated", updated));
    }
}
