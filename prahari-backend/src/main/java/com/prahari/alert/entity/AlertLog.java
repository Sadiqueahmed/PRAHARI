package com.prahari.alert.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Alert Log entity — audit trail for all dispatched alerts.
 * 
 * Every WhatsApp message or SMS sent by the Alert Engine is logged here.
 * Used for delivery tracking, debugging, compliance, and analytics.
 * 
 * Table: {@code alert_logs}
 */
@Entity
@Table(name = "alert_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "hazard_zone_id")
    private UUID hazardZoneId;

    @Column(name = "user_id")
    private UUID userId;

    /** Notification channel: WHATSAPP, SMS_TWILIO, SMS_FAST2SMS */
    @Column(nullable = false, length = 20)
    private String channel;

    /** Delivery status: QUEUED, SENT, DELIVERED, READ, FAILED, FALLBACK */
    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "template_name", length = 100)
    private String templateName;

    @Column(name = "message_preview", columnDefinition = "TEXT")
    private String messagePreview;

    /** External message ID from WhatsApp/Twilio/Fast2SMS API */
    @Column(name = "external_msg_id", length = 255)
    private String externalMsgId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Builder.Default
    @Column(name = "attempted_at", nullable = false)
    private OffsetDateTime attemptedAt = OffsetDateTime.now();

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;
}
