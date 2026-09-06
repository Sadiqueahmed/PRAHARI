package com.prahari.hazard.entity;

/**
 * Hazard severity levels.
 * Determines alert priority, UI color intensity, and notification urgency.
 */
public enum Severity {

    /**
     * Low severity — informational, no immediate action required.
     * UI: Muted color, no push notification.
     */
    LOW,

    /**
     * Medium severity — monitor situation, prepare for possible action.
     * UI: Standard color, optional push notification.
     */
    MEDIUM,

    /**
     * High severity — immediate attention required, take precautionary measures.
     * UI: Bright color, push notification to affected users.
     */
    HIGH,

    /**
     * Critical severity — life-threatening, evacuate immediately.
     * UI: Pulsing red, push + WhatsApp + SMS to all affected users.
     */
    CRITICAL
}
