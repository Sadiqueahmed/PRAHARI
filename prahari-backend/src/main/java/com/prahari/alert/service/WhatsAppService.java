package com.prahari.alert.service;

import com.prahari.alert.dto.AlertPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * WhatsApp Business Cloud API integration service.
 * 
 * Sends template messages to users via the Meta Graph API.
 * Template: "prahari_hazard_alert" — must be pre-approved in Meta Business Manager.
 * 
 * API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppService {

    @Value("${prahari.whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${prahari.whatsapp.access-token:}")
    private String accessToken;

    @Value("${prahari.whatsapp.api-version:v21.0}")
    private String apiVersion;

    @Value("${prahari.whatsapp.base-url:https://graph.facebook.com}")
    private String baseUrl;

    private final WebClient.Builder webClientBuilder;

    /**
     * Send a WhatsApp template message to the user.
     * 
     * Uses the "prahari_hazard_alert" template with parameters:
     *   - {{1}} = severity (e.g., "CRITICAL")
     *   - {{2}} = hazard type (e.g., "EARTHQUAKE")
     *   - {{3}} = hazard title/description
     *
     * @param payload Alert details including the user's WhatsApp ID
     * @return true if the message was sent successfully, false otherwise
     */
    public boolean sendTemplateMessage(AlertPayload payload) {
        // Skip if WhatsApp is not configured
        if (phoneNumberId.isBlank() || accessToken.isBlank()) {
            log.warn("WhatsApp not configured — skipping message to {}", payload.getUserName());
            return false;
        }

        try {
            String url = String.format("%s/%s/%s/messages", baseUrl, apiVersion, phoneNumberId);

            // Build the template message payload per Meta Cloud API spec
            Map<String, Object> requestBody = Map.of(
                    "messaging_product", "whatsapp",
                    "to", payload.getWhatsappId(),
                    "type", "template",
                    "template", Map.of(
                            "name", "prahari_hazard_alert",
                            "language", Map.of("code", "en"),
                            "components", List.of(
                                    Map.of(
                                            "type", "body",
                                            "parameters", List.of(
                                                    Map.of("type", "text", "text", payload.getSeverity()),
                                                    Map.of("type", "text", "text", payload.getHazardType()),
                                                    Map.of("type", "text", "text", payload.getHazardTitle())
                                            )
                                    )
                            )
                    )
            );

            WebClient client = webClientBuilder.build();

            String response = client.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("WhatsApp message sent to {} — response: {}",
                    payload.getWhatsappId(), response);
            return true;

        } catch (Exception e) {
            log.error("WhatsApp API error for {}: {}", payload.getWhatsappId(), e.getMessage());
            return false;
        }
    }
}
