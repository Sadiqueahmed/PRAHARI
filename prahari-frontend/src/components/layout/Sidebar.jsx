import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

/**
 * Sidebar — Dark-themed navigation panel for switching between hazard modules.
 * 
 * Positioned on the left side of the map, collapsible to icon-only mode.
 * Navigation items change based on the user's RBAC role.
 */

/** SVG icons as inline components for zero-dependency icons */
const Icons = {
  Flood: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15c6.667-6 13.333 0 20-6" /><path d="M2 19c6.667-6 13.333 0 20-6" />
    </svg>
  ),
  Earthquake: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h3l3-9 4 18 4-18 3 9h3" />
    </svg>
  ),
  Landslide: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l4 8 5-5 5 15H2z" />
    </svg>
  ),
  Air: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  ),
  SOS: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Logistics: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  Layers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Collapse: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
    </svg>
  ),
  Expand: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
    </svg>
  ),
};

export default function Sidebar({ activeModule, onModuleChange }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isNGOPlus = ['NGO', 'GOVERNMENT', 'SUPER_ADMIN'].includes(user?.role);
  const isGovPlus = ['GOVERNMENT', 'SUPER_ADMIN'].includes(user?.role);

  const modules = [
    { id: 'floods', label: 'Floods', icon: Icons.Flood, color: '#3B82F6', show: true },
    { id: 'earthquakes', label: 'Earthquakes', icon: Icons.Earthquake, color: '#F59E0B', show: true },
    { id: 'landslides', label: 'Landslides', icon: Icons.Landslide, color: '#EF4444', show: true },
    { id: 'airquality', label: 'Air Quality', icon: Icons.Air, color: '#8B5CF6', show: true },
    { id: 'sos', label: 'SOS Alerts', icon: Icons.SOS, color: '#DC2626', show: true },
    { id: 'logistics', label: 'Logistics', icon: Icons.Logistics, color: '#10B981', show: isNGOPlus },
    { id: 'layers', label: 'Map Layers', icon: Icons.Layers, color: '#94A3B8', show: true },
  ];

  return (
    <div
      className="sidebar flex flex-col h-full"
      style={{ width: collapsed ? '64px' : '220px' }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b"
           style={{ borderColor: 'var(--color-panel-border)' }}>
        <span className="text-2xl">🛡️</span>
        {!collapsed && (
          <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Prahari
          </span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {modules
          .filter((m) => m.show)
          .map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;

            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                title={collapsed ? module.label : undefined}
                style={isActive ? { color: module.color } : undefined}
              >
                <Icon />
                {!collapsed && <span>{module.label}</span>}
              </button>
            );
          })}
      </nav>

      {/* User Info & Collapse */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'var(--color-panel-border)' }}>
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {user.fullName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {user.role}
            </p>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={logout}
            className="sidebar-item w-full text-xs"
            style={{ color: '#EF4444' }}
          >
            Logout
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center mt-1"
        >
          {collapsed ? <Icons.Expand /> : <Icons.Collapse />}
        </button>
      </div>
    </div>
  );
}
