import { HAZARD_COLORS, SEVERITY_COLORS } from '../../utils/constants';

/**
 * HazardDetailPanel — Slide-out detail panel for a selected hazard zone.
 *
 * Appears on the right side of the map when the user clicks a hazard zone polygon.
 * Shows hazard metadata: type, severity, description, source, timestamps, and actions.
 *
 * Props:
 *   @param {Object|null} hazard - The selected hazard zone object (null = hidden)
 *   @param {Function} onClose - Callback to close the panel
 *   @param {Function} onDeactivate - Callback to deactivate a hazard zone (Gov+)
 *   @param {boolean} canManage - Whether the user has GOVERNMENT+ role
 */
export default function HazardDetailPanel({ hazard, onClose, onDeactivate, canManage = false }) {
  if (!hazard) return null;

  const typeColor = HAZARD_COLORS[hazard.hazardType]?.primary || '#3B82F6';
  const severityColor = SEVERITY_COLORS[hazard.severity] || '#94A3B8';
  const severityClass = `badge badge-${hazard.severity?.toLowerCase() || 'low'}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const typeLabels = {
    FLOOD: '🌊 Flood',
    EARTHQUAKE: '📳 Earthquake',
    LANDSLIDE: '⛰️ Landslide',
    AIR_QUALITY: '💨 Air Quality',
  };

  return (
    <div
      className="map-overlay glass-panel"
      style={{
        top: '16px',
        right: '16px',
        width: '340px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        borderLeft: `3px solid ${typeColor}`,
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
        className="flex items-start justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-panel-border)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{typeLabels[hazard.hazardType] || hazard.hazardType}</span>
            <span className={severityClass}>{hazard.severity}</span>
          </div>
          <h3
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {hazard.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-4">
        {/* Description */}
        {hazard.description && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {hazard.description}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="space-y-2">
          <MetaRow label="Source" value={hazard.source || 'Manual'} />
          <MetaRow label="Started" value={formatDate(hazard.startedAt)} />
          {hazard.expiresAt && <MetaRow label="Expires" value={formatDate(hazard.expiresAt)} />}
          {hazard.radiusKm && <MetaRow label="Radius" value={`${hazard.radiusKm} km`} />}
        </div>

        {/* Metadata JSON (key details from JSONB) */}
        {hazard.metadata && Object.keys(hazard.metadata).length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Details
            </p>
            <div className="space-y-1.5">
              {Object.entries(hazard.metadata).map(([key, value]) => (
                <MetaRow
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={String(value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions — Government+ only */}
        {canManage && hazard.isActive && (
          <div style={{ borderTop: '1px solid var(--color-panel-border)', paddingTop: '12px' }}>
            <button
              onClick={() => onDeactivate?.(hazard.id)}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#DC2626',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
              }}
            >
              Deactivate Hazard Zone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small metadata row: label — value */
function MetaRow({ label, value }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 rounded-lg"
      style={{ background: 'rgba(241, 245, 249, 0.8)' }}
    >
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}
