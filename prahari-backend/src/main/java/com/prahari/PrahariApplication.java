package com.prahari;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Project Prahari — Multi-Hazard Disaster Intelligence Platform
 * 
 * Main entry point for the Spring Boot backend.
 * Features:
 *   - PostGIS spatial queries for hazard zone detection
 *   - JWT-based RBAC (Citizen, NGO, Government, Super Admin)
 *   - Webhook alert engine with WhatsApp/SMS fan-out
 *   - REST API for SOS, inventory, and hazard management
 */
@SpringBootApplication
@EnableAsync  // Enables async alert broadcasting via virtual threads
public class PrahariApplication {

    public static void main(String[] args) {
        SpringApplication.run(PrahariApplication.class, args);
    }
}
