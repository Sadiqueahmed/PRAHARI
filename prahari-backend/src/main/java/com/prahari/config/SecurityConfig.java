package com.prahari.config;

import com.prahari.auth.service.JwtService;
import com.prahari.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Spring Security configuration with JWT-based stateless authentication.
 * 
 * Architecture:
 *   1. Client sends JWT in the Authorization: Bearer header
 *   2. JwtAuthFilter extracts and validates the token
 *   3. If valid, sets the SecurityContext with user details
 *   4. Method-level security (@PreAuthorize) enforces RBAC
 * 
 * Public endpoints: /auth/**, /actuator/health
 * Protected endpoints: Everything else (requires valid JWT)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize on controller methods
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Disable CSRF — we're using JWT tokens (stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // Apply CORS configuration from CorsConfig bean
                .cors(cors -> cors.configurationSource(
                        http.getSharedObject(org.springframework.web.cors.CorsConfigurationSource.class)
                ))

                // Stateless session — no server-side sessions
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Endpoint authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints — no authentication required
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/webhook/**").permitAll()  // WhatsApp webhooks

                        // Hazard data — readable by all authenticated users
                        .requestMatchers(HttpMethod.GET, "/hazards/**").authenticated()

                        // Hazard creation — only backend services (via API key) or GOVERNMENT+
                        .requestMatchers(HttpMethod.POST, "/hazards/**").hasAnyAuthority(
                                "GOVERNMENT", "SUPER_ADMIN")

                        // SOS endpoints — any authenticated user can create
                        .requestMatchers(HttpMethod.POST, "/sos").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/sos/*/acknowledge").hasAnyAuthority(
                                "NGO", "GOVERNMENT", "SUPER_ADMIN")

                        // Inventory — NGO+ can manage
                        .requestMatchers("/inventory/**").hasAnyAuthority(
                                "NGO", "GOVERNMENT", "SUPER_ADMIN")

                        // Admin endpoints — SUPER_ADMIN only
                        .requestMatchers("/admin/**").hasAuthority("SUPER_ADMIN")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )

                // Add JWT filter before Spring's username/password filter
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ================================================================
    // JWT Authentication Filter — Inner Component
    // ================================================================

    /**
     * OncePerRequestFilter that extracts JWT from the Authorization header,
     * validates it, and sets the SecurityContext for the current request.
     */
    @Component
    @RequiredArgsConstructor
    public static class JwtAuthFilter extends OncePerRequestFilter {

        private final JwtService jwtService;
        private final UserDetailsService userDetailsService;

        @Override
        protected void doFilterInternal(
                HttpServletRequest request,
                HttpServletResponse response,
                FilterChain filterChain) throws ServletException, IOException {

            // Extract the Authorization header
            final String authHeader = request.getHeader("Authorization");

            // Skip if no Bearer token present
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            final String jwt = authHeader.substring(7);  // Remove "Bearer " prefix

            try {
                final String userEmail = jwtService.extractUsername(jwt);

                // Only authenticate if not already authenticated in this request
                if (userEmail != null &&
                        SecurityContextHolder.getContext().getAuthentication() == null) {

                    var userDetails = userDetailsService.loadUserByUsername(userEmail);

                    if (jwtService.isTokenValid(jwt, userDetails.getUsername())) {
                        var authToken = new org.springframework.security.authentication
                                .UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new org.springframework.security.web
                                .authentication.WebAuthenticationDetailsSource()
                                .buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                // Invalid token — silently continue without authentication
                // The endpoint authorization will handle the 401/403 response
                logger.debug("JWT validation failed: " + e.getMessage());
            }

            filterChain.doFilter(request, response);
        }
    }

    // ================================================================
    // UserDetailsService Implementation
    // ================================================================

    /**
     * Loads user details from the database for Spring Security authentication.
     * Maps the Prahari User entity to Spring Security's UserDetails.
     */
    @Component
    @RequiredArgsConstructor
    public static class PrahariUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;

        @Override
        public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(
                String email) throws UsernameNotFoundException {

            var user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException(
                            "User not found with email: " + email));

            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPasswordHash(),
                    user.getIsActive(),       // enabled
                    true,                      // accountNonExpired
                    true,                      // credentialsNonExpired
                    true,                      // accountNonLocked
                    List.of(new SimpleGrantedAuthority(user.getRole().name()))
            );
        }
    }
}
