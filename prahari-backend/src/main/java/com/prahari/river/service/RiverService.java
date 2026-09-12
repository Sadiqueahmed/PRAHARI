package com.prahari.river.service;

import com.prahari.river.dto.RiverStationDTO;
import com.prahari.river.entity.RiverReading;
import com.prahari.river.entity.RiverStation;
import com.prahari.river.repository.RiverReadingRepository;
import com.prahari.river.repository.RiverStationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for river monitoring station data.
 * 
 * Aggregates station metadata with latest readings for the dashboard.
 * Used by RiverController to serve the River Levels widget and
 * map marker data in the frontend.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RiverService {

    private final RiverStationRepository stationRepository;
    private final RiverReadingRepository readingRepository;

    /**
     * Get all stations with their latest reading.
     * Used by the dashboard's River Level bar chart and map markers.
     */
    public List<RiverStationDTO> getAllStationsWithLatestReading() {
        List<RiverStation> stations = stationRepository.findAllByOrderByStationNameAsc();
        List<RiverReading> latestReadings = readingRepository.findLatestReadingPerStation();

        // Build a lookup map: stationId → latest reading
        Map<UUID, RiverReading> readingMap = latestReadings.stream()
                .collect(Collectors.toMap(
                        r -> r.getStation().getId(),
                        r -> r,
                        (a, b) -> a  // In case of duplicates, keep the first
                ));

        return stations.stream()
                .map(station -> toDTO(station, readingMap.get(station.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Get a single station with its latest reading.
     */
    public RiverStationDTO getStationById(UUID id) {
        RiverStation station = stationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("River station not found: " + id));

        RiverReading latestReading = readingRepository.findLatestByStationId(id);
        return toDTO(station, latestReading);
    }

    /**
     * Get time-series readings for a specific station.
     * Returns the most recent readings (limited by the repository query).
     */
    public List<RiverReading> getReadingsForStation(UUID stationId) {
        // Verify the station exists
        if (!stationRepository.existsById(stationId)) {
            throw new EntityNotFoundException("River station not found: " + stationId);
        }
        return readingRepository.findByStationIdOrderByReadingTimeDesc(stationId);
    }

    /**
     * Get stations where the latest reading is above danger level.
     * Used for the alert panel in the dashboard.
     */
    public List<RiverStationDTO> getStationsAboveDanger() {
        return getAllStationsWithLatestReading().stream()
                .filter(dto -> Boolean.TRUE.equals(dto.getIsAboveDanger()))
                .collect(Collectors.toList());
    }

    // ====================================================================
    // Private Helpers
    // ====================================================================

    /**
     * Map a RiverStation entity + optional RiverReading to a DTO.
     */
    private RiverStationDTO toDTO(RiverStation station, RiverReading reading) {
        RiverStationDTO.RiverStationDTOBuilder builder = RiverStationDTO.builder()
                .id(station.getId().toString())
                .stationCode(station.getStationCode())
                .stationName(station.getStationName())
                .riverName(station.getRiverName())
                .basin(station.getBasin())
                .state(station.getState())
                .longitude(station.getLocation().getX())
                .latitude(station.getLocation().getY())
                .dangerLevel(station.getDangerLevel())
                .warningLevel(station.getWarningLevel())
                .highestFloodLevel(station.getHighestFloodLevel());

        if (reading != null) {
            builder.currentLevel(reading.getWaterLevel())
                    .flowRate(reading.getFlowRate())
                    .trend(reading.getTrend())
                    .readingTime(reading.getReadingTime().toString())
                    .isAboveDanger(reading.getIsAboveDanger())
                    .isAboveWarning(reading.getIsAboveWarning());
        }

        return builder.build();
    }
}
