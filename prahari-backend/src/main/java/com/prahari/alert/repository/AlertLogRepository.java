package com.prahari.alert.repository;

import com.prahari.alert.entity.AlertLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for AlertLog entity.
 */
@Repository
public interface AlertLogRepository extends JpaRepository<AlertLog, UUID> {

    List<AlertLog> findByHazardZoneIdOrderByAttemptedAtDesc(UUID hazardZoneId);

    List<AlertLog> findByUserIdOrderByAttemptedAtDesc(UUID userId);

    long countByHazardZoneIdAndStatus(UUID hazardZoneId, String status);
}
