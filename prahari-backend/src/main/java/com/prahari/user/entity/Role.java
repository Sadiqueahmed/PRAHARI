package com.prahari.user.entity;

/**
 * RBAC Role Enumeration for Project Prahari.
 * 
 * Hierarchy (highest to lowest):
 *   SUPER_ADMIN → GOVERNMENT → NGO → CITIZEN
 * 
 * Each role determines:
 *   - Which API endpoints are accessible
 *   - Which UI views/components are rendered
 *   - What data is visible in the dashboard
 */
public enum Role {

    /**
     * General public user.
     * Access: SOS panic button, safe route calculation, emergency push alerts,
     *         personal hazard notifications.
     */
    CITIZEN,

    /**
     * NGO worker / humanitarian organization.
     * Access: Everything in CITIZEN + logistics dashboard, live inventory matching,
     *         claiming supply deficits at relief camps, volunteer coordination.
     */
    NGO,

    /**
     * Government official (NDMA, SDMA, District Administration).
     * Access: Everything in NGO + command operations view, K-Means clustered SOS
     *         heatmaps, predictive inundation models, alert broadcasting controls.
     */
    GOVERNMENT,

    /**
     * Platform super administrator.
     * Access: Everything + user management, organization approval, system config,
     *         API key management, audit logs.
     */
    SUPER_ADMIN
}
