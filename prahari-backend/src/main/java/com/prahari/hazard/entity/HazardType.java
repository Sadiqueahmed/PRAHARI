package com.prahari.hazard.entity;

/**
 * Hazard type classification for the Digital Twin.
 * Each type maps to a specific data source and visualization layer on the map.
 */
public enum HazardType {

    /**
     * Flood hazard zones.
     * Source: CWC/NWDP river level data, predictive inundation models.
     * Map Layer: Blue polygons with opacity based on severity.
     */
    FLOOD,

    /**
     * Earthquake impact zones.
     * Source: USGS Earthquake GeoJSON feed.
     * Map Layer: Concentric circles (radius based on magnitude).
     */
    EARTHQUAKE,

    /**
     * Landslide susceptibility zones.
     * Source: NASA LHASA model nowcasts.
     * Map Layer: Red/orange polygons for high-risk terrain.
     */
    LANDSLIDE,

    /**
     * Air quality hazard zones.
     * Source: AQICN API readings.
     * Map Layer: Purple heatmap overlay.
     */
    AIR_QUALITY
}
