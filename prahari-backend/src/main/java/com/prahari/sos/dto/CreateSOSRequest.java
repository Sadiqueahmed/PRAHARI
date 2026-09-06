package com.prahari.sos.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating an SOS request (panic button).
 * Location is required — captured via browser Geolocation API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSOSRequest {

    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    /** Optional message describing the emergency */
    private String message;
}
