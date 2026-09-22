package com.prahari.airquality.service;

import com.prahari.airquality.dto.AirQualityDTO;
import com.prahari.airquality.entity.AirQualityReading;
import com.prahari.airquality.repository.AirQualityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for air quality data operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AirQualityService {

    private final AirQualityRepository repository;

    /**
     * Get the latest AQI reading (most recent across all stations).
     */
    @Transactional(readOnly = true)
    public AirQualityDTO getLatestReading() {
        return repository.findTopByOrderByReadingTimeDesc()
                .map(this::toDTO)
                .orElse(null);
    }

    /**
     * Get the latest AQI reading for a specific station.
     */
    @Transactional(readOnly = true)
    public AirQualityDTO getLatestForStation(String stationName) {
        return repository.findTopByStationNameOrderByReadingTimeDesc(stationName)
                .map(this::toDTO)
                .orElse(null);
    }

    /**
     * Get the latest reading for each monitoring station.
     */
    @Transactional(readOnly = true)
    public List<AirQualityDTO> getLatestPerStation() {
        return repository.findLatestPerStation()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Get recent readings for a station (time series for charts).
     */
    @Transactional(readOnly = true)
    public List<AirQualityDTO> getRecentForStation(String stationName) {
        return repository.findTop24ByStationNameOrderByReadingTimeDesc(stationName)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Get stations where AQI exceeds threshold (for alerts).
     */
    @Transactional(readOnly = true)
    public List<AirQualityDTO> getStationsAboveThreshold(int threshold) {
        return repository.findStationsAboveThreshold(threshold)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Convert entity to DTO, flattening PostGIS Point to lon/lat.
     */
    private AirQualityDTO toDTO(AirQualityReading reading) {
        return AirQualityDTO.builder()
                .id(reading.getId().toString())
                .stationName(reading.getStationName())
                .longitude(reading.getLocation() != null ? reading.getLocation().getX() : 0)
                .latitude(reading.getLocation() != null ? reading.getLocation().getY() : 0)
                .aqi(reading.getAqi())
                .dominantPollutant(reading.getDominantPollutant())
                .pm25(reading.getPm25())
                .pm10(reading.getPm10())
                .o3(reading.getO3())
                .no2(reading.getNo2())
                .co(reading.getCo())
                .so2(reading.getSo2())
                .readingTime(reading.getReadingTime() != null ? reading.getReadingTime().toString() : null)
                .aqiCategory(AirQualityDTO.categorize(reading.getAqi()))
                .build();
    }
}
