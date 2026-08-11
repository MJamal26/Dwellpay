import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token, data.household);
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      if (!data.household) {
        navigate('/onboarding/create-household');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="auth-shell">
      {/* Left panel (desktop only) */}
      <div className="auth-panel-left">
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 72, marginBottom: 'var(--space-6)' }}>🏡</div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, marginBottom: 'var(--space-4)' }}>
            DwellPay
          </h1>
          <p style={{ fontSize: 'var(--text-body-lg)', opacity: 0.85, lineHeight: 1.6 }}>
            Split household expenses fairly. Track every rupee. Settle debts effortlessly.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
            {['🏠 Shared Households', '💸 Smart Splits', '⚡ Real-time Sync'].map((f) => (
              <div
                key={f}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--text-label-md)',
                  fontWeight: 500,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-logo">
            <div className="auth-logo-icon">🏡</div>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-headline-md)', fontWeight: 700 }}>
              DwellPay
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-headline-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Welcome back
          </h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>
            Sign in to your household account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange('password')}
                required
              />
            </div>

            {/* Inline error banner */}
            {error && (
              <div style={{
                background: 'var(--color-error-container)',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-label-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-muted mt-6" style={{ fontSize: 'var(--text-label-md)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
