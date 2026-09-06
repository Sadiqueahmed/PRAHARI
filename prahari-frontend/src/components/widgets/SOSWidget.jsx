/**
 * SOSWidget — Displays active SOS count and recent SOS requests.
 * Used in the floating panel overlay on the map.
 */
export default function SOSWidget({ activeCount = 0, recentSOS = [] }) {
  return (
    <div>
      {/* Active SOS count — big number */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{ background: 'rgba(220, 38, 38, 0.2)' }}
        >
          <span className="text-xl">🚨</span>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: '#FCA5A5' }}>
            {activeCount}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Active SOS Requests
          </p>
        </div>
      </div>

      {/* Recent SOS list */}
      {recentSOS.length > 0 && (
        <div className="space-y-2">
          {recentSOS.slice(0, 4).map((sos, i) => (
            <div
              key={sos.id || i}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'rgba(30, 41, 59, 0.6)' }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {sos.user?.fullName || 'Anonymous'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {sos.message || 'Emergency alert triggered'}
                </p>
              </div>
              <span className={`badge badge-${sos.status === 'ACTIVE' ? 'critical' : 'medium'}`}>
                {sos.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {recentSOS.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          No active SOS requests
        </p>
      )}
    </div>
  );
}
