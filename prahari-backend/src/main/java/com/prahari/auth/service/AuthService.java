package com.prahari.auth.service;

import com.prahari.auth.dto.AuthResponse;
import com.prahari.auth.dto.LoginRequest;
import com.prahari.auth.dto.RegisterRequest;
import com.prahari.common.util.GeometryUtil;
import com.prahari.user.entity.Role;
import com.prahari.user.entity.User;
import com.prahari.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication service handling user registration and login.
 * 
 * Registration flow:
 *   1. Validate that email is not already taken
 *   2. Hash the password with BCrypt
 *   3. Optionally set the user's location from lat/lng
 *   4. Save the user to the database
 *   5. Generate and return a JWT token
 * 
 * Login flow:
 *   1. Authenticate credentials via Spring Security's AuthenticationManager
 *   2. If valid, generate and return a JWT token
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user and return a JWT token.
     *
     * @param request Registration details (email, password, name, role, etc.)
     * @return AuthResponse with JWT token and user info
     * @throws IllegalArgumentException if the email is already registered
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        // Determine the role — default to CITIZEN if not specified
        Role role;
        try {
            role = request.getRole() != null && !request.getRole().isBlank()
                    ? Role.valueOf(request.getRole().toUpperCase())
                    : Role.CITIZEN;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole()
                    + ". Valid roles: CITIZEN, NGO, GOVERNMENT, SUPER_ADMIN");
        }

        // Build the user entity
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .whatsappId(request.getWhatsappId())
                .role(role)
                .organization(request.getOrganization())
                .build();

        // Set location if lat/lng provided
        if (request.getLongitude() != null && request.getLatitude() != null) {
            user.setLocation(GeometryUtil.createPoint(
                    request.getLongitude(), request.getLatitude()));
        }

        // Save to database
        User savedUser = userRepository.save(user);
        log.info("Registered new user: {} with role: {}", savedUser.getEmail(), role);

        // Generate JWT token
        String token = jwtService.generateToken(savedUser.getEmail(), role.name());

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(role.name())
                .build();
    }

    /**
     * Authenticate a user and return a JWT token.
     *
     * @param request Login credentials (email, password)
     * @return AuthResponse with JWT token and user info
     * @throws org.springframework.security.authentication.BadCredentialsException if credentials are invalid
     */
    public AuthResponse login(LoginRequest request) {
        // Spring Security handles credential validation
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        // If we get here, authentication was successful
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
