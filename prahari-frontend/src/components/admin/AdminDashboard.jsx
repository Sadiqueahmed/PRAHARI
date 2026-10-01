import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import client from '../../api/client';
import { ROLE_LABELS } from '../../utils/constants';

/**
 * AdminDashboard — Platform administration panel for SUPER_ADMIN users.
 * 
 * Features:
 *   - Platform statistics (users, alerts, hazards)
 *   - User management table with role/status editing
 *   - Alert log history with channel/status badges
 * 
 * @param {Function} onClose - Close callback to return to map view
 */

const ROLE_COLORS = {
  CITIZEN: '#3B82F6',
  NGO: '#10B981',
  GOVERNMENT: '#F59E0B',
  SUPER_ADMIN: '#8B5CF6',
};

const STATUS_COLORS = {
  SENT: '#10B981',
  DELIVERED: '#059669',
  READ: '#047857',
  QUEUED: '#F59E0B',
  FAILED: '#EF4444',
  FALLBACK: '#D97706',
};

const CHANNEL_ICONS = {
  WHATSAPP: '💬',
  SMS_TWILIO: '📱',
  SMS_FAST2SMS: '📲',
  PUSH: '🔔',
  EMAIL: '📧',
};

export default function AdminDashboard({ onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, alertsRes] = await Promise.allSettled([
        client.get('/admin/stats'),
        client.get('/admin/users'),
        client.get('/admin/alerts'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data?.data || []);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data?.data || []);
    } catch (err) {
      console.error('Admin data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Update user role or status
  const handleUpdateUser = async (userId, updates) => {
    try {
      await client.put(`/admin/users/${userId}`, updates);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (userId, isActive) => {
    try {
      const action = isActive ? 'deactivate' : 'reactivate';
      await client.put(`/admin/users/${userId}/${action}`);
      fetchData();
    } catch (err) {
      console.error('Failed to toggle user:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'alerts', label: 'Alert History', icon: '🔔' },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '520px',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(24px)',
      boxShadow: '-4px 0 32px rgba(0,0,0,0.1)',
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
      animation: 'slideInRight 0.3s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
            ⚙️ Admin Dashboard
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94A3B8' }}>
            Platform management & monitoring
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: '#94A3B8', padding: '4px',
          }}
        >✕</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', padding: '8px 20px',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? '#3B82F6' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '14px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
            Loading admin data...
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Stats cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3B82F6' },
                    { label: 'Active Users', value: stats.activeUsers, icon: '✅', color: '#10B981' },
                    { label: 'Total Alerts', value: stats.totalAlerts || 0, icon: '🔔', color: '#F59E0B' },
                    { label: 'Failed Alerts', value: stats.failedAlerts || 0, icon: '❌', color: '#EF4444' },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: `${stat.color}08`,
                      border: `1px solid ${stat.color}15`,
                    }}>
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B' }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Role Distribution */}
                {stats.roleDistribution && (
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 600, color: '#1E293B',
                      marginBottom: '10px'
                    }}>
                      Role Distribution
                    </div>
                    {Object.entries(stats.roleDistribution).map(([role, count]) => (
                      <div key={role} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: ROLE_COLORS[role] || '#94A3B8',
                          }} />
                          <span style={{ fontSize: '12px', color: '#334155' }}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  fontSize: '11px', color: '#94A3B8', marginBottom: '4px'
                }}>
                  {users.length} users registered
                </div>
                {users.map(u => (
                  <div key={u.id} style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: u.isActive ? 'rgba(0,0,0,0.02)' : 'rgba(239,68,68,0.04)',
                    border: `1px solid ${u.isActive ? 'rgba(0,0,0,0.04)' : 'rgba(239,68,68,0.12)'}`,
                    transition: 'background 0.15s',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                          {u.fullName}
                        </span>
                        {!u.isActive && (
                          <span style={{
                            marginLeft: '8px', fontSize: '9px', fontWeight: 600,
                            padding: '1px 6px', borderRadius: '4px',
                            background: '#FEE2E2', color: '#DC2626',
                          }}>INACTIVE</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '6px',
                        background: `${ROLE_COLORS[u.role] || '#94A3B8'}15`,
                        color: ROLE_COLORS[u.role] || '#94A3B8',
                      }}>
                        {u.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                      {u.email} {u.organization ? `• ${u.organization}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['CITIZEN', 'NGO', 'GOVERNMENT', 'SUPER_ADMIN']
                        .filter(r => r !== u.role)
                        .map(role => (
                          <button
                            key={role}
                            onClick={() => handleUpdateUser(u.id, { role })}
                            style={{
                              padding: '3px 8px', fontSize: '9px', fontWeight: 500,
                              borderRadius: '5px', border: '1px solid rgba(0,0,0,0.08)',
                              background: 'white', color: '#64748B',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >→ {role}</button>
                        ))
                      }
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        style={{
                          padding: '3px 8px', fontSize: '9px', fontWeight: 600,
                          borderRadius: '5px', border: 'none', cursor: 'pointer',
                          background: u.isActive ? '#FEE2E2' : '#D1FAE5',
                          color: u.isActive ? '#DC2626' : '#059669',
                          marginLeft: 'auto',
                        }}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alert History Tab */}
            {activeTab === 'alerts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '12px'
                  }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📭</span>
                    No alerts sent yet
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
                      {alerts.length} alerts dispatched
                    </div>
                    {alerts.slice(0, 50).map(alert => (
                      <div key={alert.id} style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(0,0,0,0.04)',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                            {CHANNEL_ICONS[alert.channel] || '📨'} {alert.channel}
                          </span>
                          <span style={{
                            fontSize: '9px', fontWeight: 600,
                            padding: '1px 6px', borderRadius: '4px',
                            background: `${STATUS_COLORS[alert.status] || '#94A3B8'}18`,
                            color: STATUS_COLORS[alert.status] || '#94A3B8',
                          }}>
                            {alert.status}
                          </span>
                        </div>
                        {alert.messagePreview && (
                          <div style={{
                            fontSize: '11px', color: '#64748B',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {alert.messagePreview}
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                          {alert.attemptedAt
                            ? new Date(alert.attemptedAt).toLocaleString('en-IN')
                            : ''}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
