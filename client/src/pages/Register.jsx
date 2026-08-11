import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setAuth(data.user, data.token, null);
      addToast(`Welcome, ${data.user.name}! 🎉`, 'success');
      navigate('/onboarding/join-household');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel-left">
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 72, marginBottom: 'var(--space-6)' }}>🏡</div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, marginBottom: 'var(--space-4)' }}>
            Join DwellPay
          </h1>
          <p style={{ fontSize: 'var(--text-body-lg)', opacity: 0.85, lineHeight: 1.6 }}>
            Create your account and start managing expenses with your household in seconds.
          </p>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-logo">
            <div className="auth-logo-icon">🏡</div>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-headline-md)', fontWeight: 700 }}>
              DwellPay
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-headline-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Create your account
          </h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>
            It's free, no credit card needed.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Rahul Mehta"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-muted mt-6" style={{ fontSize: 'var(--text-label-md)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
