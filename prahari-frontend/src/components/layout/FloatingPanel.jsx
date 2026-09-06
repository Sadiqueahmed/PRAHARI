import { useState } from 'react';

/**
 * FloatingPanel — Reusable glassmorphism container for data widgets.
 * 
 * Positioned absolutely over the map. Collapsible with a smooth animation.
 * Used for all floating dashboard panels: hazard stats, river levels, SOS, etc.
 * 
 * Props:
 *   @param {string} title - Panel header title
 *   @param {React.ReactNode} children - Panel content
 *   @param {string} className - Additional CSS classes for positioning
 *   @param {boolean} defaultCollapsed - Whether to start collapsed
 *   @param {string} accentColor - Left border accent color (hazard-aware)
 */
export default function FloatingPanel({
  title,
  children,
  className = '',
  defaultCollapsed = false,
  accentColor,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={`glass-panel map-overlay ${className}`}
      style={{
        minWidth: '280px',
        maxWidth: '380px',
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
      }}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--color-panel-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round"
          style={{
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Content — collapsible */}
      <div
        style={{
          maxHeight: collapsed ? '0' : '500px',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="px-4 py-3">
          {children}
        </div>
      </div>
    </div>
  );
}
