package com.prahari.alert.service;

import com.prahari.alert.dto.AlertPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Fast2SMS service for Indian SMS delivery.
 * 
 * Used as a fallback when WhatsApp fails for Indian phone numbers (+91).
 * Fast2SMS is significantly cheaper than Twilio for Indian numbers.
 * 
 * API Docs: https://docs.fast2sms.com/
 * Endpoint: GET https://www.fast2sms.com/dev/bulkV2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Fast2SmsService {

    @Value("${prahari.fast2sms.api-key:}")
    private String apiKey;

    @Value("${prahari.fast2sms.base-url:https://www.fast2sms.com/dev/bulkV2}")
    private String baseUrl;

    private final WebClient.Builder webClientBuilder;

    /**
     * Send an SMS via Fast2SMS Quick SMS route.
     *
     * @param payload Alert details including the user's Indian phone number
     * @return true if the SMS was sent successfully
     */
    public boolean sendSms(AlertPayload payload) {
        if (apiKey.isBlank()) {
            log.warn("Fast2SMS not configured — skipping SMS to {}", payload.getUserName());
            return false;
        }

        try {
            // Extract the 10-digit Indian number (without country code)
            String indianNumber = extractIndianNumber(payload.getPhone());

            // Compose the alert message
            String message = String.format(
                    "PRAHARI ALERT [%s] %s: %s. Stay safe. Visit prahari.dev",
                    payload.getSeverity(), payload.getHazardType(), payload.getHazardTitle());

            WebClient client = webClientBuilder.build();

            // Fast2SMS accepts GET requests with query parameters
            String response = client.get()
                    .uri(baseUrl + "?authorization={apiKey}&route=q&message={message}&numbers={numbers}",
                            apiKey, message, indianNumber)
                    .header("accept", "application/json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Fast2SMS sent to {} — response: {}", indianNumber, response);
            return true;

        } catch (Exception e) {
            log.error("Fast2SMS error for {}: {}", payload.getPhone(), e.getMessage());
            return false;
        }
    }

    /**
     * Extract the 10-digit Indian mobile number from various formats.
     * Input: "+919876543210", "919876543210", "9876543210"
     * Output: "9876543210"
     */
    private String extractIndianNumber(String phone) {
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("91") && cleaned.length() == 12) {
            return cleaned.substring(2);  // Remove "91" prefix
        }
        if (cleaned.length() == 10) {
            return cleaned;  // Already 10 digits
        }
        return cleaned;  // Return as-is if format is unexpected
    }
}
