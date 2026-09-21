import { useState, useEffect, useCallback } from 'react';
import client from '../../api/client';

/**
 * SOSManagement — Full SOS request management panel for NGO/Government roles.
 *
 * Features:
 *   - List all active SOS requests
 *   - Acknowledge (claim) an SOS
 *   - Resolve an SOS
 *   - Auto-refresh every 15 seconds
 *   - Color-coded status badges
 *
 * Props:
 *   @param {Function} onClose - Callback to close the panel
 */
export default function SOSManagement({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ACTIVE');

  const fetchSOS = useCallback(async () => {
    try {
      const response = await client.get('/sos/active');
      if (response.data?.data) {
        setRequests(response.data.data);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load SOS requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSOS();
    const interval = setInterval(fetchSOS, 15000);
    return () => clearInterval(interval);
  }, [fetchSOS]);

  const handleAcknowledge = async (id) => {
    setActionLoading(id);
    try {
      await client.put(`/sos/${id}/acknowledge`);
      fetchSOS();
    } catch (err) {
      console.error('Acknowledge failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id) => {
    setActionLoading(id);
    try {
      await client.put(`/sos/${id}/resolve`);
      fetchSOS();
    } catch (err) {
      console.error('Resolve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter((r) =>
    filter === 'ALL' ? true : r.status === filter
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      className="map-overlay glass-panel"
      style={{
        top: '16px',
        right: '16px',
        width: '380px',
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '3px solid #DC2626',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-panel-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🚨</span>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            SOS Management
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#DC2626' }}
          >
            {requests.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-panel-border)' }}>
        {['ACTIVE', 'ACKNOWLEDGED', 'ALL'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === f ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              color: filter === f ? '#2563EB' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* SOS List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-lg text-xs"
            style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#B91C1C' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No {filter === 'ALL' ? '' : filter.toLowerCase()} SOS requests
            </p>
          </div>
        )}

        {filtered.map((sos) => (
          <div
            key={sos.id}
            className="rounded-xl p-3 transition-all"
            style={{
              background: sos.status === 'ACTIVE'
                ? 'rgba(220, 38, 38, 0.04)'
                : 'rgba(241, 245, 249, 0.8)',
              border: sos.status === 'ACTIVE'
                ? '1px solid rgba(220, 38, 38, 0.15)'
                : '1px solid var(--color-panel-border)',
            }}
          >
            {/* Top row: user + time + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: sos.status === 'ACTIVE' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    color: sos.status === 'ACTIVE' ? '#DC2626' : '#2563EB',
                  }}
                >
                  {(sos.user?.fullName || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {sos.user?.fullName || 'Anonymous'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
                    {formatTime(sos.createdAt)}
                  </p>
                </div>
              </div>
              <span className={`badge badge-${sos.status === 'ACTIVE' ? 'critical' : sos.status === 'ACKNOWLEDGED' ? 'medium' : 'low'}`}>
                {sos.status}
              </span>
            </div>

            {/* Message */}
            {sos.message && (
              <p className="text-xs mb-2 pl-9" style={{ color: 'var(--color-text-secondary)' }}>
                {sos.message}
              </p>
            )}

            {/* Hazard zone link */}
            {sos.hazardZone && (
              <div className="pl-9 mb-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}
                >
                  📍 {sos.hazardZone.title}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pl-9">
              {sos.status === 'ACTIVE' && (
                <button
                  onClick={() => handleAcknowledge(sos.id)}
                  disabled={actionLoading === sos.id}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#D97706',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    cursor: actionLoading === sos.id ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === sos.id ? 0.6 : 1,
                  }}
                >
                  {actionLoading === sos.id ? '...' : 'Acknowledge'}
                </button>
              )}
              {(sos.status === 'ACTIVE' || sos.status === 'ACKNOWLEDGED') && (
                <button
                  onClick={() => handleResolve(sos.id)}
                  disabled={actionLoading === sos.id}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    cursor: actionLoading === sos.id ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === sos.id ? 0.6 : 1,
                  }}
                >
                  {actionLoading === sos.id ? '...' : 'Resolve'}
                </button>
              )}
            </div>

            {/* Responder info */}
            {sos.responder && (
              <p className="text-xs mt-2 pl-9" style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
                Claimed by: {sos.responder.fullName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
