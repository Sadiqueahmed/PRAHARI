package com.prahari.river.repository;

import com.prahari.river.entity.RiverStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for RiverStation with spatial queries.
 */
@Repository
public interface RiverStationRepository extends JpaRepository<RiverStation, UUID> {

    Optional<RiverStation> findByStationCode(String stationCode);

    List<RiverStation> findByState(String state);

    List<RiverStation> findByRiverName(String riverName);

    List<RiverStation> findAllByOrderByStationNameAsc();
}
