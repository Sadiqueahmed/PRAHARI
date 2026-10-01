import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import client from '../../api/client';

/**
 * UserProfile — Self-service profile management panel.
 * 
 * Allows any authenticated user to:
 *   - View their profile details
 *   - Edit name, phone, WhatsApp ID, organization
 *   - Update their GPS location (for disaster alert targeting)
 * 
 * @param {Function} onClose - Close callback
 */
export default function UserProfile({ onClose }) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState(null);
  const [locating, setLocating] = useState(false);

  // Fetch profile from backend
  const fetchProfile = useCallback(async () => {
    try {
      const response = await client.get('/users/me');
      if (response.data?.data) {
        setProfile(response.data.data);
        setForm(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Fall back to auth context data
      if (authUser) {
        setProfile({
          email: authUser.email,
          fullName: authUser.fullName,
          role: authUser.role,
        });
      }
    }
  }, [authUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Save profile changes
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await client.put('/users/me', {
        fullName: form.fullName,
        phone: form.phone,
        whatsappId: form.whatsappId,
        organization: form.organization,
        longitude: form.longitude,
        latitude: form.latitude,
      });
      if (response.data?.data) {
        setProfile(response.data.data);
        setForm(response.data.data);

        // Update localStorage so auth context stays in sync
        const storedUser = JSON.parse(localStorage.getItem('prahari_user') || '{}');
        storedUser.fullName = response.data.data.fullName;
        localStorage.setItem('prahari_user', JSON.stringify(storedUser));
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update GPS location from browser
  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation not supported' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        }));
        setLocating(false);
        setMessage({ type: 'success', text: 'Location captured! Save to update.' });
        setEditing(true);
      },
      (error) => {
        setLocating(false);
        setMessage({ type: 'error', text: 'Location access denied: ' + error.message });
      },
      { enableHighAccuracy: true }
    );
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', icon: '👤', editable: true },
    { key: 'email', label: 'Email', icon: '📧', editable: false },
    { key: 'role', label: 'Role', icon: '🏷️', editable: false },
    { key: 'phone', label: 'Phone', icon: '📱', editable: true, placeholder: '+919876543210' },
    { key: 'whatsappId', label: 'WhatsApp ID', icon: '💬', editable: true, placeholder: '919876543210' },
    { key: 'organization', label: 'Organization', icon: '🏢', editable: true, placeholder: 'Your organization' },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '400px',
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
            👤 My Profile
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94A3B8' }}>
            Manage your account details
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

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {!profile ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
            Loading profile...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Status message */}
            {message && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                background: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                color: message.type === 'success' ? '#059669' : '#DC2626',
                animation: 'fadeSlideUp 0.2s ease-out',
              }}>
                {message.text}
              </div>
            )}

            {/* Profile fields */}
            {fields.map(field => (
              <div key={field.key} style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '11px', color: '#64748B', marginBottom: '4px',
                }}>
                  <span>{field.icon}</span> {field.label}
                </label>
                {editing && field.editable ? (
                  <input
                    type="text"
                    value={form[field.key] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      fontSize: '13px',
                      color: '#1E293B',
                      background: 'white',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
                    {profile[field.key] || '—'}
                  </div>
                )}
              </div>
            ))}

            {/* Location */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.04)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', color: '#64748B', marginBottom: '6px',
              }}>
                📍 GPS Location
              </label>
              <div style={{ fontSize: '13px', color: '#1E293B', marginBottom: '8px' }}>
                {form.latitude && form.longitude
                  ? `${form.latitude.toFixed(4)}°N, ${form.longitude.toFixed(4)}°E`
                  : 'Not set'}
              </div>
              <button
                onClick={handleUpdateLocation}
                disabled={locating}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: '#2563EB',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: locating ? 'wait' : 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {locating ? '📡 Locating...' : '📍 Update My Location'}
              </button>
            </div>

            {/* Account info */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Member since: {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })
                  : '—'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        gap: '8px',
      }}>
        {editing ? (
          <>
            <button
              onClick={() => { setEditing(false); setForm(profile); setMessage(null); }}
              style={{
                flex: 1, padding: '10px',
                borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                background: 'white', color: '#64748B',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '10px',
                borderRadius: '8px', border: 'none',
                background: '#3B82F6', color: 'white',
                fontSize: '12px', fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >{saving ? 'Saving...' : 'Save Changes'}</button>
          </>
        ) : (
          <button
            onClick={() => { setEditing(true); setMessage(null); }}
            style={{
              flex: 1, padding: '10px',
              borderRadius: '8px', border: 'none',
              background: '#3B82F6', color: 'white',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >✏️ Edit Profile</button>
        )}
      </div>
    </div>
  );
}
