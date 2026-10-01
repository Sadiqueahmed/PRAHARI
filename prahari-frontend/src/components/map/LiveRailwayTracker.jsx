import { useState, useEffect, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

/**
 * LiveRailwayTracker — Simulated railway tracking overlay for NE India.
 *
 * Since there's no free real-time Indian Railways API, this component
 * simulates active trains on major NE India routes with realistic
 * movement animation using Mapbox GL.
 *
 * Routes are based on real railway corridors:
 *   - Guwahati–Dibrugarh (Rajdhani/Shatabdi)
 *   - Guwahati–Silchar (Barak Valley)
 *   - New Jalpaiguri–Guwahati (main corridor)
 *   - Guwahati–Lumding Junction
 *
 * @param {Object} mapRef - Mapbox GL map reference
 * @param {boolean} mapLoaded - Whether map is ready
 */

const SOURCE_ID = 'live-railways';
const LAYER_ID = 'live-railways-layer';
const LABEL_LAYER_ID = 'live-railways-labels';
const ROUTE_SOURCE = 'railway-routes';
const ROUTE_LAYER = 'railway-routes-layer';

// Realistic NE India train data
const NE_INDIA_TRAINS = [
  {
    id: 'T12423',
    name: 'Dibrugarh Rajdhani',
    number: '12423',
    route: 'New Delhi → Dibrugarh',
    routeCoords: [
      [91.74, 26.14], // Guwahati
      [92.72, 26.19], // Nagaon
      [93.73, 26.72], // Jorhat
      [94.90, 27.47], // Dibrugarh
    ],
    color: '#DC2626',
    speed: '110 km/h',
  },
  {
    id: 'T15603',
    name: 'Silchar Express',
    number: '15603',
    route: 'Guwahati → Silchar',
    routeCoords: [
      [91.74, 26.14], // Guwahati
      [92.72, 25.81], // Lumding
      [93.00, 25.17], // Haflong
      [92.80, 24.83], // Silchar
    ],
    color: '#2563EB',
    speed: '75 km/h',
  },
  {
    id: 'T15959',
    name: 'Kamrup Express',
    number: '15959',
    route: 'Howrah → Guwahati',
    routeCoords: [
      [88.40, 26.71], // New Jalpaiguri
      [89.50, 26.32], // Cooch Behar
      [90.63, 26.13], // Bongaigaon
      [91.74, 26.14], // Guwahati
    ],
    color: '#059669',
    speed: '95 km/h',
  },
  {
    id: 'T12507',
    name: 'Guwahati–Trivandrum',
    number: '12507',
    route: 'Guwahati → Bangalore',
    routeCoords: [
      [91.74, 26.14], // Guwahati
      [90.63, 26.13], // Bongaigaon
      [89.50, 26.32], // Cooch Behar
      [88.40, 26.71], // New Jalpaiguri
    ],
    color: '#7C3AED',
    speed: '100 km/h',
  },
  {
    id: 'T15615',
    name: 'Naharlagun Express',
    number: '15615',
    route: 'Guwahati → Naharlagun',
    routeCoords: [
      [91.74, 26.14], // Guwahati
      [92.72, 26.19], // Nagaon
      [93.44, 26.76], // Rangapara
      [93.69, 27.10], // Naharlagun
    ],
    color: '#D97706',
    speed: '65 km/h',
  },
];

/**
 * Interpolate position along a route based on progress (0-1).
 */
function interpolateRoute(coords, progress) {
  if (coords.length < 2) return coords[0];

  const totalSegments = coords.length - 1;
  const segIndex = Math.min(Math.floor(progress * totalSegments), totalSegments - 1);
  const segProgress = (progress * totalSegments) - segIndex;

  const from = coords[segIndex];
  const to = coords[segIndex + 1];

  return [
    from[0] + (to[0] - from[0]) * segProgress,
    from[1] + (to[1] - from[1]) * segProgress,
  ];
}

/**
 * Calculate bearing between two points.
 */
function calcBearing(from, to) {
  const dLng = (to[0] - from[0]) * Math.PI / 180;
  const lat1 = from[1] * Math.PI / 180;
  const lat2 = to[1] * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function LiveRailwayTracker({ mapRef, mapLoaded }) {
  const [enabled, setEnabled] = useState(false);
  const [trainCount, setTrainCount] = useState(0);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const popupRef = useRef(null);

  /**
   * Set up map layers and start animation.
   */
  const setupLayers = useCallback(() => {
    if (!mapRef?.current || !mapLoaded) return;
    if (mapRef.current.getSource(SOURCE_ID)) return;

    // Route lines (dashed)
    const routeFeatures = NE_INDIA_TRAINS.map(train => ({
      type: 'Feature',
      properties: { name: train.name, color: train.color },
      geometry: {
        type: 'LineString',
        coordinates: train.routeCoords,
      },
    }));

    mapRef.current.addSource(ROUTE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: routeFeatures },
    });

    mapRef.current.addLayer({
      id: ROUTE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': 0.35,
        'line-dasharray': [4, 4],
      },
    });

    // Train markers source (empty — populated by animation)
    mapRef.current.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Train marker layer (circle with colored fill)
    mapRef.current.addLayer({
      id: LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 6,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 0.95,
      },
    });

    // Train name labels
    mapRef.current.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      minzoom: 6.5,
      layout: {
        'text-field': ['concat', '🚂 ', ['get', 'name']],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 10,
        'text-offset': [0, 1.8],
        'text-anchor': 'top',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#1E293B',
        'text-halo-color': 'rgba(255,255,255,0.9)',
        'text-halo-width': 1.5,
      },
    });

    // Click popup
    mapRef.current.on('click', LAYER_ID, (e) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const coords = e.features[0].geometry.coordinates.slice();

      const html = `
        <div style="font-family: 'Inter', sans-serif; min-width: 150px;">
          <p style="font-weight: 700; color: #1E293B; margin: 0 0 2px; font-size: 14px;">
            🚂 ${props.name}
          </p>
          <p style="color: #64748B; margin: 0 0 6px; font-size: 11px;">
            Train #${props.number}
          </p>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <span style="color:#64748B; font-size:11px;">Route</span>
            <span style="font-weight:500; color:#1E293B; font-size:11px; text-align:right;">${props.route}</span>
            <span style="color:#64748B; font-size:11px;">Speed</span>
            <span style="font-weight:600; color:#1E293B; font-size:12px; text-align:right;">${props.speed}</span>
          </div>
          <div style="margin-top: 6px; text-align:center; padding: 3px 8px; border-radius: 6px; background: ${props.color}20; color: ${props.color}; font-size: 10px; font-weight: 600;">
            EN ROUTE
          </div>
        </div>
      `;

      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new mapboxgl.Popup({ offset: 12, closeButton: true })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(mapRef.current);
    });

    // Cursor change
    mapRef.current.on('mouseenter', LAYER_ID, () => {
      mapRef.current.getCanvas().style.cursor = 'pointer';
    });
    mapRef.current.on('mouseleave', LAYER_ID, () => {
      mapRef.current.getCanvas().style.cursor = '';
    });

    setTrainCount(NE_INDIA_TRAINS.length);
  }, [mapRef, mapLoaded]);

  /**
   * Animate trains along their routes.
   */
  const animate = useCallback(() => {
    if (!mapRef?.current || !startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    // Each train completes route in ~120 seconds, then reverses
    const cycleDuration = 120;

    const features = NE_INDIA_TRAINS.map((train, i) => {
      // Offset each train's start so they don't all start at the same position
      const offset = (i * cycleDuration) / NE_INDIA_TRAINS.length;
      const t = ((elapsed + offset) % (cycleDuration * 2));
      // Ping-pong: go forward then backward
      const progress = t < cycleDuration
        ? t / cycleDuration
        : 1 - (t - cycleDuration) / cycleDuration;

      const coords = interpolateRoute(train.routeCoords, Math.max(0, Math.min(1, progress)));

      return {
        type: 'Feature',
        properties: {
          id: train.id,
          name: train.name,
          number: train.number,
          route: train.route,
          color: train.color,
          speed: train.speed,
        },
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
      };
    });

    const source = mapRef.current.getSource(SOURCE_ID);
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [mapRef]);

  /**
   * Remove all railway layers.
   */
  const removeLayers = useCallback(() => {
    if (!mapRef?.current) return;
    if (popupRef.current) popupRef.current.remove();
    cancelAnimationFrame(animFrameRef.current);

    [LABEL_LAYER_ID, LAYER_ID, ROUTE_LAYER].forEach(id => {
      if (mapRef.current.getLayer(id)) mapRef.current.removeLayer(id);
    });
    [SOURCE_ID, ROUTE_SOURCE].forEach(id => {
      if (mapRef.current.getSource(id)) mapRef.current.removeSource(id);
    });
  }, [mapRef]);

  /**
   * Toggle railway tracking.
   */
  const toggle = useCallback(() => {
    if (enabled) {
      cancelAnimationFrame(animFrameRef.current);
      removeLayers();
      setEnabled(false);
      setTrainCount(0);
    } else {
      setupLayers();
      startTimeRef.current = Date.now();
      animFrameRef.current = requestAnimationFrame(animate);
      setEnabled(true);
    }
  }, [enabled, setupLayers, removeLayers, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      removeLayers();
    };
  }, [removeLayers]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '170px',
      right: '12px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
    }}>
      {/* Train info badge */}
      {enabled && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '10px',
          padding: '8px 12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          border: '1px solid rgba(217, 119, 6, 0.2)',
          fontSize: '11px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#334155',
          animation: 'fadeSlideUp 0.2s ease-out',
        }}>
          <span style={{ fontWeight: 600, color: '#92400E' }}>
            🚂 {trainCount} trains active
          </span>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggle}
        title={enabled ? 'Disable railway tracking' : 'Enable railway tracking'}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: enabled
            ? '1px solid rgba(217, 119, 6, 0.3)'
            : '1px solid rgba(0,0,0,0.1)',
          background: enabled
            ? 'rgba(217, 119, 6, 0.08)'
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'transform 0.15s',
          position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🚂
        {enabled && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22C55E',
            border: '2px solid white',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>
    </div>
  );
}
