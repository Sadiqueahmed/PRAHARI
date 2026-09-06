package com.prahari.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Standardized API response wrapper for all REST endpoints.
 * 
 * Provides a consistent response format across the entire API:
 * <pre>
 * {
 *   "success": true,
 *   "message": "Hazard zone created successfully",
 *   "data": { ... },
 *   "timestamp": "2024-07-15T10:30:00Z"
 * }
 * </pre>
 * 
 * On error:
 * <pre>
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "error": "email: must not be blank",
 *   "timestamp": "2024-07-15T10:30:00Z"
 * }
 * </pre>
 *
 * @param <T> The type of the response data payload
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private String error;

    @Builder.Default
    private OffsetDateTime timestamp = OffsetDateTime.now();

    /**
     * Create a successful response with data.
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Create a successful response without data.
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Create an error response.
     */
    public static <T> ApiResponse<T> error(String message, String errorDetail) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .error(errorDetail)
                .build();
    }
}
