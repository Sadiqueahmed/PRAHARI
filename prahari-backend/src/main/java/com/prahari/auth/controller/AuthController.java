package com.prahari.auth.controller;

import com.prahari.auth.dto.AuthResponse;
import com.prahari.auth.dto.LoginRequest;
import com.prahari.auth.dto.RegisterRequest;
import com.prahari.auth.service.AuthService;
import com.prahari.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST controller.
 * 
 * Endpoints (all public — no JWT required):
 *   POST /api/auth/register — Register a new user
 *   POST /api/auth/login    — Login and receive JWT token
 * 
 * Note: The /api prefix comes from server.servlet.context-path in application.yml
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user.
     * 
     * @param request Registration details (validated)
     * @return JWT token + user info
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    /**
     * Login with email and password.
     * 
     * @param request Login credentials (validated)
     * @return JWT token + user info
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity
                .ok(ApiResponse.success("Login successful", response));
    }
}
