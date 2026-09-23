import { useState } from 'react';

/**
 * MapStyleSwitcher — Gods Eye View-inspired sensor mode toggle.
 *
 * Switches between Mapbox map styles: Satellite, Terrain, Dark, Light.
 * Renders as a compact floating pill in the bottom-right of the map.
 *
 * @param {Object} mapRef - Reference to the Mapbox GL map instance
 */

const MAP_STYLES = [
  { id: 'light',     label: 'Light',     icon: '☀️', style: 'mapbox://styles/mapbox/light-v11' },
  { id: 'satellite', label: 'Satellite', icon: '🛰️', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'dark',      label: 'Dark',      icon: '🌙', style: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'terrain',   label: 'Terrain',   icon: '🏔️', style: 'mapbox://styles/mapbox/outdoors-v12' },
];

export default function MapStyleSwitcher({ mapRef }) {
  const [activeStyle, setActiveStyle] = useState('light');
  const [expanded, setExpanded] = useState(false);

  const handleStyleChange = (styleObj) => {
    if (!mapRef?.current) return;
    mapRef.current.setStyle(styleObj.style);
    setActiveStyle(styleObj.id);
    setExpanded(false);
  };

  const activeObj = MAP_STYLES.find(s => s.id === activeStyle);

  return (
    <div style={{
      position: 'absolute',
      bottom: '120px',
      right: '12px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
    }}>
      {/* Expanded style list */}
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
          {MAP_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStyleChange(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                border: 'none',
                borderRadius: '8px',
                background: activeStyle === s.id
                  ? 'rgba(37, 99, 235, 0.12)'
                  : 'transparent',
                color: activeStyle === s.id ? '#2563EB' : '#334155',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeStyle === s.id ? 600 : 400,
                fontFamily: 'Inter, system-ui, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (activeStyle !== s.id) e.target.style.background = 'rgba(0,0,0,0.04)';
              }}
              onMouseLeave={e => {
                if (activeStyle !== s.id) e.target.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        title="Switch map style"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.target.style.transform = 'scale(1.08)';
          e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
        }}
      >
        {activeObj?.icon || '🗺️'}
      </button>
    </div>
  );
}
