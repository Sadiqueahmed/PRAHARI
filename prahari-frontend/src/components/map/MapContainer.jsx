import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, MAP_CENTER, MAP_ZOOM, MAP_PITCH, MAP_BEARING, HAZARD_COLORS } from '../../utils/constants';

/**
 * MapContainer — Full-screen Mapbox GL JS 2.5D terrain map.
 * 
 * This is the core visual component of Prahari's Digital Twin.
 * Renders the entire NE India region with 3D terrain, atmospheric effects,
 * toggleable hazard data layers, and river station markers.
 * 
 * Props:
 *   @param {Object[]} hazardZones - Array of active hazard zones to render
 *   @param {Object[]} riverStations - Array of RiverStationDTO for map markers
 *   @param {Function} onMapLoad - Callback when the map is fully initialized
 */
export default function MapContainer({ hazardZones = [], riverStations = [], onMapLoad }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (map.current) return; // Prevent double initialization

    // Guard: check for Mapbox token
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
      setMapError('Mapbox token not configured. Set VITE_MAPBOX_TOKEN in your .env file.');
      if (onMapLoad) onMapLoad(null);
      return;
    }

    // Set the Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',   // Light theme for disaster dashboard
      center: MAP_CENTER,                           // Guwahati, Assam
      zoom: MAP_ZOOM,                               // Show all NE India
      pitch: MAP_PITCH,                             // 2.5D tilt effect
      bearing: MAP_BEARING,                         // Slight rotation
      antialias: true,
      projection: 'globe',                          // 3D globe projection
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // On map load — configure terrain and atmosphere
    map.current.on('style.load', () => {
      // Add 3D terrain
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add atmospheric sky effect
      map.current.setFog({
        color: 'rgb(10, 15, 30)',         // Dark fog for nighttime disaster feel
        'high-color': 'rgb(20, 30, 60)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(5, 10, 20)',
        'star-intensity': 0.4,
      });

      // Add 3D building extrusions
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.current.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#CBD5E1',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7,
          },
        },
        labelLayerId
      );

      setMapLoaded(true);
      if (onMapLoad) onMapLoad(map.current);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Render hazard zones on the map when data changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !hazardZones.length) return;

    // Remove existing hazard layers before re-adding
    const existingLayers = ['hazard-zones-fill', 'hazard-zones-outline'];
    existingLayers.forEach((layerId) => {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    });
    if (map.current.getSource('hazard-zones')) map.current.removeSource('hazard-zones');

    // Build GeoJSON FeatureCollection from hazard zones
    const features = hazardZones
      .filter((hz) => hz.geometry)
      .map((hz) => ({
        type: 'Feature',
        properties: {
          id: hz.id,
          hazardType: hz.hazardType,
          severity: hz.severity,
          title: hz.title,
          color: HAZARD_COLORS[hz.hazardType]?.primary || '#3B82F6',
        },
        geometry: hz.geometry,
      }));

    // Add hazard zone source
    map.current.addSource('hazard-zones', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    // Add filled polygon layer (semi-transparent)
    map.current.addLayer({
      id: 'hazard-zones-fill',
      type: 'fill',
      source: 'hazard-zones',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.25,
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'hazard-zones-outline',
      type: 'line',
      source: 'hazard-zones',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });

    // Add hover tooltip for hazard zones
    map.current.on('mouseenter', 'hazard-zones-fill', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'hazard-zones-fill', () => {
      map.current.getCanvas().style.cursor = '';
    });

  }, [hazardZones, mapLoaded]);

  // ================================================================
  // Render river station markers on the map
  // ================================================================
  useEffect(() => {
    if (!mapLoaded || !map.current || !riverStations.length) return;

    // Remove existing river layers before re-adding
    const existingLayers = ['river-stations-circle', 'river-stations-label'];
    existingLayers.forEach((layerId) => {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    });
    if (map.current.getSource('river-stations')) map.current.removeSource('river-stations');

    // Build GeoJSON features from river station DTOs
    const features = riverStations
      .filter((s) => s.longitude != null && s.latitude != null)
      .map((s) => {
        // Determine marker color based on water level vs thresholds
        let markerColor = '#3B82F6'; // Blue = safe
        if (s.isAboveDanger) {
          markerColor = '#EF4444'; // Red = danger
        } else if (s.isAboveWarning) {
          markerColor = '#F59E0B'; // Amber = warning
        }

        return {
          type: 'Feature',
          properties: {
            id: s.id,
            name: s.stationName,
            river: s.riverName,
            state: s.state,
            currentLevel: s.currentLevel,
            dangerLevel: s.dangerLevel,
            warningLevel: s.warningLevel,
            trend: s.trend,
            color: markerColor,
            isAboveDanger: s.isAboveDanger || false,
            isAboveWarning: s.isAboveWarning || false,
          },
          geometry: {
            type: 'Point',
            coordinates: [s.longitude, s.latitude],
          },
        };
      });

    // Add river stations source
    map.current.addSource('river-stations', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    // Add circle markers
    map.current.addLayer({
      id: 'river-stations-circle',
      type: 'circle',
      source: 'river-stations',
      paint: {
        'circle-radius': 7,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 0.9,
      },
    });

    // Add station name labels (visible at higher zoom)
    map.current.addLayer({
      id: 'river-stations-label',
      type: 'symbol',
      source: 'river-stations',
      minzoom: 7,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': '#1E293B',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1.5,
      },
    });

    // Click popup for station details
    map.current.on('click', 'river-stations-circle', (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates.slice();
      const props = feature.properties;

      // Build popup HTML
      const levelDisplay = props.currentLevel != null
        ? `${props.currentLevel}m`
        : 'No data';
      const trendIcon = props.trend === 'RISING' ? '↑' : props.trend === 'FALLING' ? '↓' : '→';
      const statusColor = props.isAboveDanger ? '#EF4444' : props.isAboveWarning ? '#F59E0B' : '#10B981';
      const statusLabel = props.isAboveDanger ? 'DANGER' : props.isAboveWarning ? 'WARNING' : 'NORMAL';

      const popupHTML = `
        <div style="font-family: 'Inter', sans-serif; min-width: 160px;">
          <p style="font-weight: 600; color: #1E293B; margin: 0 0 4px 0; font-size: 13px;">
            ${props.name}
          </p>
          <p style="color: #64748B; margin: 0 0 8px 0; font-size: 11px;">
            ${props.river} • ${props.state}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #64748B; font-size: 11px;">Level</span>
            <span style="font-weight: 600; color: #1E293B; font-size: 12px;">
              ${levelDisplay} ${trendIcon}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #64748B; font-size: 11px;">Danger</span>
            <span style="color: #EF4444; font-size: 12px;">${props.dangerLevel}m</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: #64748B; font-size: 11px;">Warning</span>
            <span style="color: #F59E0B; font-size: 12px;">${props.warningLevel}m</span>
          </div>
          <div style="text-align: center; padding: 3px 8px; border-radius: 6px; background: ${statusColor}15; color: ${statusColor}; font-size: 10px; font-weight: 600; letter-spacing: 0.05em;">
            ${statusLabel}
          </div>
        </div>
      `;

      // Remove previous popup
      if (popupRef.current) popupRef.current.remove();

      popupRef.current = new mapboxgl.Popup({ offset: 12, closeButton: true })
        .setLngLat(coords)
        .setHTML(popupHTML)
        .addTo(map.current);
    });

    // Cursor change on hover
    map.current.on('mouseenter', 'river-stations-circle', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'river-stations-circle', () => {
      map.current.getCanvas().style.cursor = '';
    });

  }, [riverStations, mapLoaded]);

  if (mapError) {
    return (
      <div
        id="map-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 50%, #94A3B8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          textAlign: 'center',
          padding: '32px',
          background: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🗺️</span>
          <p style={{ color: '#1E293B', fontWeight: 600, fontSize: '14px', margin: '0 0 8px 0' }}>
            Map Unavailable
          </p>
          <p style={{ color: '#64748B', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
            {mapError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      id="map-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}
