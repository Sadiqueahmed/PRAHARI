package com.prahari.alert.service;

import com.prahari.alert.dto.AlertPayload;
import com.prahari.alert.entity.AlertLog;
import com.prahari.alert.repository.AlertLogRepository;
import com.prahari.hazard.entity.HazardZone;
import com.prahari.user.entity.User;
import com.prahari.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Alert Orchestrator — the core webhook alert engine.
 * 
 * This is the CRITICAL component of Prahari's disaster response system.
 * 
 * When a new hazard zone is created (e.g., a 6.0 earthquake with 50km radius):
 *   1. PostGIS ST_Within query finds all users inside the hazard polygon
 *   2. For each affected user, a virtual thread is spawned to send alerts
 *   3. Alert priority: WhatsApp (primary) → SMS (fallback)
 *   4. SMS routing: Indian numbers → Fast2SMS, international → Twilio
 *   5. Every attempt is logged to alert_logs for audit trail
 * 
 * Runs on Java 21 virtual threads for massively concurrent fan-out.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertOrchestrator {

    private final UserRepository userRepository;
    private final WhatsAppService whatsAppService;
    private final TwilioSmsService twilioSmsService;
    private final Fast2SmsService fast2SmsService;
    private final AlertLogRepository alertLogRepository;

    /**
     * Process a newly created hazard zone — find affected users and send alerts.
     * 
     * This method runs asynchronously on a virtual thread to avoid blocking
     * the HTTP request that created the hazard zone.
     *
     * @param hazardZone The newly created hazard zone
     */
    @Async("alertExecutor")
    public void processNewHazardZone(HazardZone hazardZone) {
        log.info("🚨 Alert Engine triggered for hazard: {} [{}] severity={}",
                hazardZone.getTitle(), hazardZone.getHazardType(), hazardZone.getSeverity());

        // Step 1: Find all users within the hazard polygon using PostGIS ST_Within
        List<User> affectedUsers = userRepository.findUsersWithinHazardZone(hazardZone.getId());

        if (affectedUsers.isEmpty()) {
            log.info("No users found within hazard zone: {}", hazardZone.getTitle());
            return;
        }

        log.info("Found {} users within hazard zone: {}", affectedUsers.size(),
                hazardZone.getTitle());

        // Step 2: Send alerts to each affected user
        for (User user : affectedUsers) {
            try {
                AlertPayload payload = buildPayload(user, hazardZone);
                sendAlertWithFallback(payload);
            } catch (Exception e) {
                log.error("Failed to send alert to user {}: {}", user.getEmail(), e.getMessage());
            }
        }

        log.info("✅ Alert Engine completed for hazard: {} — {} users notified",
                hazardZone.getTitle(), affectedUsers.size());
    }

    /**
     * Send alert with automatic fallback:
     *   WhatsApp (primary) → SMS (fallback)
     * 
     * If WhatsApp API returns a failure, automatically falls back to SMS.
     * SMS routing: Indian numbers (+91) → Fast2SMS, all others → Twilio.
     */
    private void sendAlertWithFallback(AlertPayload payload) {
        // Attempt 1: WhatsApp (if user has a WhatsApp ID)
        if (payload.getWhatsappId() != null && !payload.getWhatsappId().isBlank()) {
            boolean whatsappSuccess = whatsAppService.sendTemplateMessage(payload);

            if (whatsappSuccess) {
                logAlert(payload, "WHATSAPP", "SENT", null);
                return;  // WhatsApp succeeded — done
            }

            log.warn("WhatsApp failed for user {}, falling back to SMS", payload.getUserName());
            logAlert(payload, "WHATSAPP", "FAILED", "WhatsApp delivery failed");
        }

        // Attempt 2: SMS fallback
        if (payload.getPhone() != null && !payload.getPhone().isBlank()) {
            boolean smsSuccess;
            String channel;

            // Route: Indian numbers → Fast2SMS, international → Twilio
            if (isIndianNumber(payload.getPhone())) {
                channel = "SMS_FAST2SMS";
                smsSuccess = fast2SmsService.sendSms(payload);
            } else {
                channel = "SMS_TWILIO";
                smsSuccess = twilioSmsService.sendSms(payload);
            }

            if (smsSuccess) {
                logAlert(payload, channel, "SENT", null);
            } else {
                logAlert(payload, channel, "FAILED", "SMS delivery failed");
                log.error("All alert channels failed for user: {}", payload.getUserName());
            }
        } else {
            log.warn("No phone number available for user: {}", payload.getUserName());
        }
    }

    /**
     * Build an AlertPayload from a User and HazardZone.
     */
    private AlertPayload buildPayload(User user, HazardZone hazardZone) {
        return AlertPayload.builder()
                .hazardZoneId(hazardZone.getId())
                .userId(user.getId())
                .userName(user.getFullName())
                .phone(user.getPhone())
                .whatsappId(user.getWhatsappId())
                .hazardType(hazardZone.getHazardType().name())
                .severity(hazardZone.getSeverity().name())
                .hazardTitle(hazardZone.getTitle())
                .countryCode(extractCountryCode(user.getPhone()))
                .build();
    }

    /**
     * Log an alert attempt to the database for audit trail.
     */
    private void logAlert(AlertPayload payload, String channel, String status, String error) {
        AlertLog log = AlertLog.builder()
                .hazardZoneId(payload.getHazardZoneId())
                .userId(payload.getUserId())
                .channel(channel)
                .status(status)
                .templateName("prahari_hazard_alert")
                .messagePreview(String.format("[%s] %s — %s",
                        payload.getSeverity(), payload.getHazardType(), payload.getHazardTitle()))
                .errorMessage(error)
                .build();

        alertLogRepository.save(log);
    }

    /**
     * Check if a phone number is an Indian number (+91 or 91 prefix).
     */
    private boolean isIndianNumber(String phone) {
        if (phone == null) return false;
        String cleaned = phone.replaceAll("[^0-9]", "");
        return cleaned.startsWith("91") && cleaned.length() >= 12;
    }

    /**
     * Extract country code from phone number.
     */
    private String extractCountryCode(String phone) {
        if (phone == null) return "UNKNOWN";
        String cleaned = phone.replaceAll("[^0-9+]", "");
        if (cleaned.startsWith("+91") || cleaned.startsWith("91")) return "IN";
        if (cleaned.startsWith("+977")) return "NP";
        if (cleaned.startsWith("+975")) return "BT";
        if (cleaned.startsWith("+86")) return "CN";
        return "OTHER";
    }
}
