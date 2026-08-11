import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function InviteMembers() {
  const { household } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const inviteCode = household?.inviteCode || '--------';
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    addToast('Invite code copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    addToast('Invite link copied!', 'success');
  };

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="step-indicator">
          <div className="step-dot active" />
          <div className="step-dot active" />
          <div className="step-dot" />
        </div>

        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>👥</div>
        <h1 className="text-headline-lg" style={{ marginBottom: 'var(--space-2)' }}>
          Invite your housemates
        </h1>
        <p className="text-muted mb-6">
          Share this code or link. They'll use it to join <strong>{household?.name}</strong>.
        </p>

        {/* Invite code */}
        <div
          style={{
            background: 'var(--color-surface-container-low)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-4)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            Invite Code
          </div>
          <div
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {inviteCode}
          </div>
          <button className="btn btn-primary" onClick={copyCode} style={{ width: '100%' }}>
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>

        {/* Share link */}
        <button className="btn btn-secondary w-full" onClick={copyLink} style={{ marginBottom: 'var(--space-6)' }}>
          🔗 Copy Invite Link
        </button>

        <div className="divider" />

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost flex-1" onClick={() => navigate('/onboarding/success')}>
            Skip for now
          </button>
          <button className="btn btn-primary flex-1" onClick={() => navigate('/onboarding/success')}>
            Done →
          </button>
        </div>

        <p className="text-center text-muted mt-4" style={{ fontSize: 'var(--text-label-sm)' }}>
          Step 2 of 3
        </p>
      </div>
    </div>
  );
}
