import { useState, useMemo } from 'react';
import { MAP_CENTER, HAZARD_COLORS, SEVERITY_COLORS } from '../../utils/constants';

/**
 * NearbyHazardsPanel — Lists hazard zones within a configurable radius
 * of the current map center, sorted by proximity.
 *
 * Inspired by Gods Eye View's "Contacts" panel which shows objects
 * within a 250km radius. This adaptation shows hazards/shelters nearby.
 *
 * @param {Object[]} hazardZones - All active hazard zones
 * @param {Object} mapCenter - { lng, lat } of current map center
 * @param {Function} onFlyTo - Callback to fly to a hazard zone
 * @param {Function} onClose - Close the panel
 */

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get centroid of a GeoJSON geometry.
 */
function getCentroid(geometry) {
  if (!geometry) return null;

  if (geometry.type === 'Point') {
    return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
  }

  // For Polygon, average all coordinates of the outer ring
  if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
    const ring = geometry.coordinates[0];
    const sum = ring.reduce((acc, c) => ({ lng: acc.lng + c[0], lat: acc.lat + c[1] }), { lng: 0, lat: 0 });
    return { lng: sum.lng / ring.length, lat: sum.lat / ring.length };
  }

  return null;
}

const RADIUS_OPTIONS = [50, 100, 250, 500]; // km

export default function NearbyHazardsPanel({ hazardZones = [], mapCenter, onFlyTo, onClose }) {
  const [radius, setRadius] = useState(250);
  const [expanded, setExpanded] = useState(true);

  // Use map center if provided, else default to Guwahati
  const center = mapCenter || { lng: MAP_CENTER[0], lat: MAP_CENTER[1] };

  // Compute nearby hazards with distances
  const nearbyHazards = useMemo(() => {
    return hazardZones
      .map(hz => {
        const centroid = getCentroid(hz.geometry);
        if (!centroid) return null;

        const distance = haversineDistance(
          center.lat, center.lng,
          centroid.lat, centroid.lng,
        );

        return { ...hz, centroid, distance };
      })
      .filter(hz => hz && hz.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [hazardZones, center.lat, center.lng, radius]);

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      right: '12px',
      zIndex: 15,
      width: '300px',
      maxHeight: expanded ? 'calc(100vh - 120px)' : '44px',
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(20px)',
      borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: '1px solid rgba(0,0,0,0.08)',
      overflow: 'hidden',
      transition: 'max-height 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📡</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>
            Nearby Hazards
          </span>
          <span style={{
            background: nearbyHazards.length > 0 ? '#FEF2F2' : '#F0FDF4',
            color: nearbyHazards.length > 0 ? '#DC2626' : '#16A34A',
            padding: '1px 7px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 600,
          }}>
            {nearbyHazards.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              fontSize: '16px',
              padding: '0 2px',
            }}
            title="Close panel"
          >
            ✕
          </button>
          <span style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: '12px',
            color: '#94A3B8',
          }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <>
          {/* Radius selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 14px',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize: '11px', color: '#64748B', marginRight: '4px' }}>
              Radius:
            </span>
            {RADIUS_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: radius === r ? '#3B82F6' : 'rgba(0,0,0,0.04)',
                  color: radius === r ? '#FFFFFF' : '#64748B',
                  fontSize: '11px',
                  fontWeight: radius === r ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r}km
              </button>
            ))}
          </div>

          {/* Hazard list */}
          <div style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 220px)',
            padding: '4px 0',
          }}>
            {nearbyHazards.length === 0 ? (
              <div style={{
                padding: '32px 14px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '12px',
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>✅</span>
                No hazards within {radius}km
              </div>
            ) : (
              nearbyHazards.map((hz, i) => {
                const typeColor = HAZARD_COLORS[hz.hazardType]?.primary || '#64748B';
                const sevColor = SEVERITY_COLORS[hz.severity] || '#64748B';

                return (
                  <div
                    key={hz.id || i}
                    onClick={() => onFlyTo?.(hz)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(0,0,0,0.03)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Color indicator */}
                    <div style={{
                      width: '4px',
                      height: '36px',
                      borderRadius: '2px',
                      background: typeColor,
                      flexShrink: 0,
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '2px',
                      }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '12px',
                          color: '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {hz.title || hz.hazardType}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: `${sevColor}18`,
                          color: sevColor,
                          flexShrink: 0,
                        }}>
                          {hz.severity}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#64748B',
                      }}>
                        {hz.hazardType.replace('_', ' ')} • {hz.source || 'Manual'}
                      </div>
                    </div>

                    {/* Distance */}
                    <div style={{
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#1E293B',
                      }}>
                        {hz.distance < 1 ? '<1' : Math.round(hz.distance)}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#94A3B8',
                      }}>
                        km
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
