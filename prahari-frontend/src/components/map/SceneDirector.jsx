import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * SceneDirector — Cinematic auto-tour of active hazard zones.
 *
 * Inspired by Gods Eye View's "Scene Director" that creates cinematic
 * camera tours. This cycles through hazard zones with smooth flyTo
 * animations, showing details at each stop.
 *
 * Modes:
 *   - IDLE: Not running
 *   - TOURING: Auto-cycling through hazard zones
 *   - PAUSED: User paused mid-tour
 *
 * @param {Object} mapRef - Mapbox GL map reference
 * @param {boolean} mapLoaded - Whether map is ready
 * @param {Object[]} hazardZones - Active hazard zones to tour
 * @param {Function} onHazardFocus - Callback when touring to a hazard
 */

const DWELL_TIME = 5000; // Time to stay at each hazard (ms)
const FLY_DURATION = 3000; // Duration of each flyTo animation (ms)

/**
 * Get centroid of a GeoJSON geometry for flyTo target.
 */
function getCentroid(geometry) {
  if (!geometry) return null;

  if (geometry.type === 'Point') {
    return [geometry.coordinates[0], geometry.coordinates[1]];
  }

  if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
    const ring = geometry.coordinates[0];
    const sum = ring.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
    return [sum[0] / ring.length, sum[1] / ring.length];
  }

  return null;
}

export default function SceneDirector({ mapRef, mapLoaded, hazardZones = [], onHazardFocus }) {
  const [mode, setMode] = useState('IDLE'); // IDLE | TOURING | PAUSED
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  // Filter to zones with valid geometry
  const tourableZones = hazardZones.filter(hz => getCentroid(hz.geometry));

  /**
   * Fly to a specific hazard zone with cinematic camera.
   */
  const flyToZone = useCallback((zone, index) => {
    if (!mapRef?.current || !mapLoaded) return;

    const center = getCentroid(zone.geometry);
    if (!center) return;

    setCurrentIndex(index);
    onHazardFocus?.(zone);

    // Cinematic camera parameters — vary by zone for visual interest
    const pitchVariations = [50, 55, 60, 45, 52];
    const bearingVariations = [-20, 15, -30, 25, -10];
    const zoomVariations = [10, 11, 10.5, 9.5, 11.5];

    mapRef.current.flyTo({
      center,
      zoom: zoomVariations[index % zoomVariations.length],
      pitch: pitchVariations[index % pitchVariations.length],
      bearing: bearingVariations[index % bearingVariations.length],
      duration: FLY_DURATION,
      essential: true,
      curve: 1.42, // Smooth arc
    });
  }, [mapRef, mapLoaded, onHazardFocus]);

  /**
   * Start the tour from the beginning.
   */
  const startTour = useCallback(() => {
    if (tourableZones.length === 0) return;

    setMode('TOURING');
    setCurrentIndex(0);
    setProgress(0);
    flyToZone(tourableZones[0], 0);

    // Start cycling
    const cycle = (idx) => {
      // Progress bar animation
      let startTime = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(elapsed / DWELL_TIME, 1));
      }, 50);

      timerRef.current = setTimeout(() => {
        clearInterval(progressRef.current);
        const nextIdx = (idx + 1) % tourableZones.length;
        setCurrentIndex(nextIdx);
        flyToZone(tourableZones[nextIdx], nextIdx);
        cycle(nextIdx);
      }, DWELL_TIME + FLY_DURATION);
    };

    // Start first dwell timer after initial fly animation
    setTimeout(() => cycle(0), FLY_DURATION);
  }, [tourableZones, flyToZone]);

  /**
   * Pause the tour.
   */
  const pauseTour = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    setMode('PAUSED');
  }, []);

  /**
   * Resume the tour from current position.
   */
  const resumeTour = useCallback(() => {
    if (tourableZones.length === 0) return;
    setMode('TOURING');

    const nextIdx = (currentIndex + 1) % tourableZones.length;

    // Start cycling from next zone
    const cycle = (idx) => {
      let startTime = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(elapsed / DWELL_TIME, 1));
      }, 50);

      timerRef.current = setTimeout(() => {
        clearInterval(progressRef.current);
        const nxt = (idx + 1) % tourableZones.length;
        setCurrentIndex(nxt);
        flyToZone(tourableZones[nxt], nxt);
        cycle(nxt);
      }, DWELL_TIME + FLY_DURATION);
    };

    flyToZone(tourableZones[nextIdx], nextIdx);
    setTimeout(() => cycle(nextIdx), FLY_DURATION);
  }, [tourableZones, currentIndex, flyToZone]);

  /**
   * Stop the tour and reset to overview.
   */
  const stopTour = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    setMode('IDLE');
    setCurrentIndex(0);
    setProgress(0);

    // Fly back to overview
    if (mapRef?.current) {
      mapRef.current.flyTo({
        center: [91.7362, 26.1445], // Guwahati
        zoom: 6.5,
        pitch: 45,
        bearing: -10,
        duration: 2000,
      });
    }
  }, [mapRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, []);

  const currentZone = tourableZones[currentIndex];

  return (
    <div style={{
      position: 'absolute',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      {/* Tour status bar — shows during tour */}
      {mode !== 'IDLE' && currentZone && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          borderRadius: '14px',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#FFFFFF',
          fontFamily: 'Inter, system-ui, sans-serif',
          minWidth: '320px',
          animation: 'fadeSlideUp 0.3s ease-out',
        }}>
          {/* Zone info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div>
              <div style={{
                fontWeight: 700,
                fontSize: '14px',
                marginBottom: '2px',
              }}>
                {currentZone.title || currentZone.hazardType}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#94A3B8',
              }}>
                {currentZone.hazardType.replace('_', ' ')} • {currentZone.severity}
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              color: '#94A3B8',
              textAlign: 'right',
            }}>
              {currentIndex + 1} / {tourableZones.length}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '3px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
              borderRadius: '2px',
              transition: 'width 0.05s linear',
            }} />
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {mode === 'IDLE' && tourableZones.length > 0 && (
          <button
            onClick={startTour}
            title="Start hazard zone tour"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#1E293B',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
            }}
          >
            <span style={{ fontSize: '14px' }}>🎬</span>
            Tour Hazard Zones ({tourableZones.length})
          </button>
        )}

        {mode === 'TOURING' && (
          <>
            <button
              onClick={pauseTour}
              title="Pause tour"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#FFFFFF',
              }}
            >
              ⏸
            </button>
            <button
              onClick={stopTour}
              title="Stop tour"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#FFFFFF',
              }}
            >
              ⏹
            </button>
          </>
        )}

        {mode === 'PAUSED' && (
          <>
            <button
              onClick={resumeTour}
              title="Resume tour"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#FFFFFF',
              }}
            >
              ▶
            </button>
            <button
              onClick={stopTour}
              title="Stop tour"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#FFFFFF',
              }}
            >
              ⏹
            </button>
          </>
        )}
      </div>
    </div>
  );
}
