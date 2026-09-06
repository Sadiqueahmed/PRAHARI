import { useState } from 'react';

/**
 * SOSButton — Emergency panic button for citizens.
 * 
 * Captures the user's GPS coordinates via the browser Geolocation API
 * and sends an SOS request to the backend.
 * 
 * Renders as a large pulsing red circle in the bottom-right of the map.
 */
export default function SOSButton({ onSOSTrigger }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleSOS = async () => {
    if (loading) return;

    // Confirm before sending — prevent accidental triggers
    const confirmed = window.confirm(
      '🚨 Are you sure you want to send an SOS emergency alert?\n\n' +
      'This will share your GPS location with emergency responders.'
    );
    if (!confirmed) return;

    setLoading(true);
    setStatus(null);

    try {
      // Get current GPS position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { longitude, latitude } = position.coords;

      // Call the parent handler
      if (onSOSTrigger) {
        await onSOSTrigger({ longitude, latitude });
      }

      setStatus('success');
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error('SOS failed:', error);
      setStatus('error');
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-overlay" style={{ bottom: '100px', right: '20px' }}>
      {/* Status message */}
      {status && (
        <div
          className="glass-panel mb-3 px-3 py-2 text-xs font-medium text-center"
          style={{
            color: status === 'success' ? '#6EE7B7' : '#FCA5A5',
            borderLeft: `3px solid ${status === 'success' ? '#10B981' : '#EF4444'}`,
          }}
        >
          {status === 'success'
            ? '✅ SOS sent! Help is on the way.'
            : '❌ Failed to send SOS. Check your connection.'}
        </div>
      )}

      {/* Panic button */}
      <button
        id="sos-button"
        onClick={handleSOS}
        disabled={loading}
        className="sos-button flex items-center justify-center"
        style={{
          width: '64px',
          height: '64px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.05em',
        }}
        title="Send SOS Emergency Alert"
      >
        {loading ? (
          <span className="text-lg">⏳</span>
        ) : (
          <span className="text-sm font-bold">SOS</span>
        )}
      </button>
    </div>
  );
}
