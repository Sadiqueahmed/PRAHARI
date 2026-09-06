package com.prahari.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT Token Service — generates and validates JSON Web Tokens.
 * 
 * Token structure:
 *   - Subject: user email
 *   - Claims: role (CITIZEN, NGO, GOVERNMENT, SUPER_ADMIN)
 *   - Algorithm: HS256 (HMAC-SHA256)
 *   - Expiry: configurable (default 24 hours)
 * 
 * All tokens are stateless — no server-side session storage.
 */
@Service
public class JwtService {

    @Value("${prahari.jwt.secret}")
    private String secretKey;

    @Value("${prahari.jwt.expiration-ms}")
    private long expirationMs;

    /**
     * Generate a JWT token for the given user email and role.
     * 
     * @param email The user's email (becomes the token subject)
     * @param role  The user's RBAC role (added as a claim)
     * @return Signed JWT token string
     */
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of("role", role))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extract the username (email) from a JWT token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract the role from a JWT token.
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    /**
     * Validate a JWT token against the expected username.
     * Checks: signature validity, expiration, and subject match.
     */
    public boolean isTokenValid(String token, String username) {
        final String tokenUsername = extractUsername(token);
        return tokenUsername.equals(username) && !isTokenExpired(token);
    }

    /**
     * Check if a token has expired.
     */
    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    /**
     * Generic claim extractor using a resolver function.
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parse all claims from a JWT token.
     * Throws JwtException if the token is invalid or expired.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Derive the HMAC-SHA256 signing key from the configured secret.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
