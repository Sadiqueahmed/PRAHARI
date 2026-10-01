import { useState } from 'react';

/**
 * WeatherOverlay — Toggle weather radar/satellite tiles on the map.
 *
 * Uses free OpenWeatherMap tile layers (precipitation, clouds, temperature)
 * and RainViewer (no key needed) for live radar data.
 *
 * @param {Object} mapRef - Mapbox GL map reference
 * @param {boolean} mapLoaded - Whether map is ready
 */

const WEATHER_LAYERS = [
  {
    id: 'rain-radar',
    label: 'Rain Radar',
    icon: '🌧️',
    getUrl: () => {
      // RainViewer — free, no API key, live radar composite
      const ts = Math.floor(Date.now() / 600000) * 600; // Round to 10-min interval
      return `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`;
    },
  },
  {
    id: 'clouds',
    label: 'Cloud Cover',
    icon: '☁️',
    getUrl: () => `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=demo`,
  },
  {
    id: 'wind',
    label: 'Wind',
    icon: '💨',
    getUrl: () => `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo`,
  },
];

export default function WeatherOverlay({ mapRef, mapLoaded }) {
  const [activeLayers, setActiveLayers] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  const toggleLayer = (layer) => {
    if (!mapRef?.current || !mapLoaded) return;

    const isActive = activeLayers.has(layer.id);

    if (isActive) {
      // Remove layer
      if (mapRef.current.getLayer(layer.id)) mapRef.current.removeLayer(layer.id);
      if (mapRef.current.getSource(layer.id)) mapRef.current.removeSource(layer.id);
      setActiveLayers(prev => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    } else {
      // Add raster tile source + layer
      if (!mapRef.current.getSource(layer.id)) {
        mapRef.current.addSource(layer.id, {
          type: 'raster',
          tiles: [layer.getUrl()],
          tileSize: 256,
        });
      }
      mapRef.current.addLayer({
        id: layer.id,
        type: 'raster',
        source: layer.id,
        paint: {
          'raster-opacity': 0.6,
          'raster-fade-duration': 300,
        },
      });
      setActiveLayers(prev => new Set(prev).add(layer.id));
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '270px',
      right: '12px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
    }}>
      {expanded && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '12px',
          padding: '6px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          animation: 'fadeSlideUp 0.2s ease-out',
        }}>
          {WEATHER_LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                border: 'none',
                borderRadius: '8px',
                background: activeLayers.has(layer.id)
                  ? 'rgba(37, 99, 235, 0.12)'
                  : 'transparent',
                color: activeLayers.has(layer.id) ? '#2563EB' : '#334155',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeLayers.has(layer.id) ? 600 : 400,
                fontFamily: 'Inter, system-ui, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{layer.icon}</span>
              {layer.label}
              {activeLayers.has(layer.id) && (
                <span style={{ fontSize: '10px', color: '#22C55E' }}>●</span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        title="Weather layers"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: activeLayers.size > 0
            ? '1px solid rgba(37, 99, 235, 0.3)'
            : '1px solid rgba(0,0,0,0.1)',
          background: activeLayers.size > 0
            ? 'rgba(37, 99, 235, 0.08)'
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🌦️
      </button>
    </div>
  );
}
