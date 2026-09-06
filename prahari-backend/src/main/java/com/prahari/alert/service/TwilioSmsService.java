package com.prahari.alert.service;

import com.prahari.alert.dto.AlertPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.Map;

/**
 * Twilio SMS service for international SMS delivery.
 * 
 * Used as a fallback when WhatsApp fails for non-Indian phone numbers
 * (Nepal +977, Bhutan +975, Tibet/China +86).
 * 
 * API Docs: https://www.twilio.com/docs/sms/send-messages
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TwilioSmsService {

    @Value("${prahari.twilio.account-sid:}")
    private String accountSid;

    @Value("${prahari.twilio.auth-token:}")
    private String authToken;

    @Value("${prahari.twilio.phone-number:}")
    private String fromPhoneNumber;

    private final WebClient.Builder webClientBuilder;

    /**
     * Send an SMS via Twilio.
     *
     * @param payload Alert details including the user's phone number
     * @return true if the SMS was sent successfully
     */
    public boolean sendSms(AlertPayload payload) {
        if (accountSid.isBlank() || authToken.isBlank()) {
            log.warn("Twilio not configured — skipping SMS to {}", payload.getUserName());
            return false;
        }

        try {
            String url = String.format(
                    "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid);

            // Compose the alert message
            String message = String.format(
                    "🚨 PRAHARI ALERT [%s]\n%s: %s\nStay safe. Visit prahari.dev for updates.",
                    payload.getSeverity(), payload.getHazardType(), payload.getHazardTitle());

            // Twilio uses Basic Auth: base64(accountSid:authToken)
            String credentials = Base64.getEncoder()
                    .encodeToString((accountSid + ":" + authToken).getBytes());

            WebClient client = webClientBuilder.build();

            String response = client.post()
                    .uri(url)
                    .header("Authorization", "Basic " + credentials)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(String.format("From=%s&To=%s&Body=%s",
                            fromPhoneNumber, payload.getPhone(), message))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Twilio SMS sent to {} — response: {}", payload.getPhone(), response);
            return true;

        } catch (Exception e) {
            log.error("Twilio SMS error for {}: {}", payload.getPhone(), e.getMessage());
            return false;
        }
    }
}
