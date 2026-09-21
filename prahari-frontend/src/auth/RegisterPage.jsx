import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ROLE_LABELS } from '../utils/constants';

/**
 * Register Page — light-themed glassmorphism registration form.
 * Supports all 4 RBAC roles with conditional organization field.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'CITIZEN',
    organization: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showOrg = ['NGO', 'GOVERNMENT'].includes(form.role);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
        organization: showOrg ? form.organization : undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(241, 245, 249, 0.8)',
    border: '1px solid var(--color-panel-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div
      className="flex items-center justify-center w-full h-full"
      style={{ background: 'linear-gradient(135deg, #E2E8F0 0%, #F1F5F9 50%, #F8FAFC 100%)' }}
    >
      <div className="glass-panel p-8 w-full max-w-md mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            🛡️ Prahari
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Create your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#B91C1C', border: '1px solid rgba(220, 38, 38, 0.2)' }}
          >
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Full Name
            </label>
            <input
              id="register-name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              placeholder="Rahim Ahmed"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              placeholder="user@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Phone <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Role
            </label>
            <select
              id="register-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
            >
              {Object.entries(ROLE_LABELS)
                .filter(([key]) => key !== 'SUPER_ADMIN')
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
          </div>

          {/* Organization (for NGO/Government) */}
          {showOrg && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Organization
              </label>
              <input
                id="register-org"
                name="organization"
                type="text"
                value={form.organization}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                placeholder={form.role === 'NGO' ? 'e.g. Red Cross' : 'e.g. NDMA'}
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              placeholder="Min. 8 characters"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loading ? 'rgba(37, 99, 235, 0.5)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Link to login */}
        <div className="mt-5 text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold"
              style={{ color: '#2563EB', textDecoration: 'none' }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
