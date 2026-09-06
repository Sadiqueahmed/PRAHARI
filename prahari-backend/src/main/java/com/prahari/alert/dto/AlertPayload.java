package com.prahari.alert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Internal DTO for passing alert context through the Alert Engine pipeline.
 * 
 * Created by AlertOrchestrator and consumed by WhatsAppService / SMS services.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertPayload {

    /** The hazard zone that triggered this alert */
    private UUID hazardZoneId;

    /** The user being notified */
    private UUID userId;

    /** User's display name (for personalized messages) */
    private String userName;

    /** User's phone number */
    private String phone;

    /** User's WhatsApp ID (phone without '+') */
    private String whatsappId;

    /** Hazard type (FLOOD, EARTHQUAKE, etc.) */
    private String hazardType;

    /** Severity level */
    private String severity;

    /** Hazard zone title / description */
    private String hazardTitle;

    /** Country code derived from phone number — determines SMS provider */
    private String countryCode;
}
