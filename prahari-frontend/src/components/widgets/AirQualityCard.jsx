/**
 * AirQualityCard — Displays current AQI reading with color-coded severity.
 * 
 * AQI ranges:
 *   0-50:    Good (Green)
 *   51-100:  Moderate (Yellow)
 *   101-150: Unhealthy for Sensitive Groups (Orange)
 *   151-200: Unhealthy (Red)
 *   201-300: Very Unhealthy (Purple)
 *   301+:    Hazardous (Maroon)
 */

function getAQIInfo(aqi) {
  if (aqi <= 50)  return { label: 'Good', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  if (aqi <= 100) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
  if (aqi <= 150) return { label: 'Unhealthy (SG)', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
  return { label: 'Hazardous', color: '#7F1D1D', bg: 'rgba(127, 29, 29, 0.2)' };
}

export default function AirQualityCard({ station = 'Guwahati', aqi = 85, pollutant = 'PM2.5' }) {
  const info = getAQIInfo(aqi);

  return (
    <div>
      {/* AQI Value — large display */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: info.bg }}
        >
          <span className="text-2xl font-bold" style={{ color: info.color }}>
            {aqi}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: info.color }}>
            {info.label}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {station}
          </p>
        </div>
      </div>

      {/* Pollutant info */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg"
           style={{ background: 'rgba(30, 41, 59, 0.6)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Dominant Pollutant
        </span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {pollutant}
        </span>
      </div>

      {/* AQI Scale bar */}
      <div className="mt-3">
        <div className="flex rounded-full overflow-hidden h-2">
          <div style={{ width: '16.6%', background: '#10B981' }} />
          <div style={{ width: '16.6%', background: '#F59E0B' }} />
          <div style={{ width: '16.6%', background: '#F97316' }} />
          <div style={{ width: '16.6%', background: '#EF4444' }} />
          <div style={{ width: '16.6%', background: '#8B5CF6' }} />
          <div style={{ width: '16.8%', background: '#7F1D1D' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>0</span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>500</span>
        </div>
      </div>
    </div>
  );
}
