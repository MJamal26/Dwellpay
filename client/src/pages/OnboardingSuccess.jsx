import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function OnboardingSuccess() {
  const navigate = useNavigate();
  const { household } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/dashboard'), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card" style={{ textAlign: 'center' }}>
        <div className="step-indicator">
          <div className="step-dot active" />
          <div className="step-dot active" />
          <div className="step-dot active" />
        </div>

        <div style={{ fontSize: 80, marginBottom: 'var(--space-6)', animation: 'scale-in 0.5s ease-out' }}>
          🎉
        </div>

        <h1 className="text-headline-lg" style={{ marginBottom: 'var(--space-3)' }}>
          You're all set!
        </h1>
        <p className="text-muted" style={{ marginBottom: 'var(--space-8)', fontSize: 'var(--text-body-lg)' }}>
          <strong>{household?.name}</strong> is ready. Start adding expenses and splitting them with your housemates.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            background: 'var(--color-surface-container-low)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-8)',
            textAlign: 'left',
          }}
        >
          {[
            { icon: '➕', text: 'Add expenses and split them equally or custom' },
            { icon: '⚖️', text: 'Track who owes what, updated in real-time' },
            { icon: '💸', text: "Settle up with one tap when it's time to pay" },
            { icon: '📊', text: 'See monthly spending reports and breakdowns' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-lg w-full" onClick={() => navigate('/dashboard')}>
          Go to Dashboard 🚀
        </button>

        <p className="text-muted mt-4" style={{ fontSize: 'var(--text-caption)' }}>
          Redirecting automatically...
        </p>
      </div>
    </div>
  );
}
