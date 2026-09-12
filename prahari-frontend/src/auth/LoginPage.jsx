import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Login Page — light-themed glassmorphism login form.
 * Supports email/password login with error handling.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full"
         style={{ background: 'linear-gradient(135deg, #E2E8F0 0%, #F1F5F9 50%, #F8FAFC 100%)' }}>
      <div className="glass-panel p-8 w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            🛡️ Prahari
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Multi-Hazard Disaster Intelligence Platform
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm"
               style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#B91C1C', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(241, 245, 249, 0.8)',
                border: '1px solid var(--color-panel-border)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="admin@prahari.dev"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(241, 245, 249, 0.8)',
                border: '1px solid var(--color-panel-border)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loading ? 'rgba(37, 99, 235, 0.5)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Demo: admin@prahari.dev / prahari123
          </p>
        </div>
      </div>
    </div>
  );
}
