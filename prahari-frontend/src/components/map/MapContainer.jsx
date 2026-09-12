import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, MAP_CENTER, MAP_ZOOM, MAP_PITCH, MAP_BEARING, HAZARD_COLORS } from '../../utils/constants';

/**
 * MapContainer — Full-screen Mapbox GL JS 2.5D terrain map.
 * 
 * This is the core visual component of Prahari's Digital Twin.
 * Renders the entire NE India region with 3D terrain, atmospheric effects,
 * and toggleable hazard data layers.
 * 
 * Props:
 *   @param {Object[]} hazardZones - Array of active hazard zones to render
 *   @param {Function} onMapLoad - Callback when the map is fully initialized
 */
export default function MapContainer({ hazardZones = [], onMapLoad }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Prevent double initialization

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
