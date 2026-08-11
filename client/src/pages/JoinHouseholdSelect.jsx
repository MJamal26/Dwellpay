import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export default function JoinHouseholdSelect() {
  const { setHousehold } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState('');
  const [joining, setJoining] = useState(false);

  // Fetch all available households
  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households-list'],
    queryFn: () => api.get('/households').then((r) => r.data),
  });

  const selected = households.find((h) => h._id === selectedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setJoining(true);
    try {
      const { data } = await api.post('/households/join-select', { householdId: selectedId });
      setHousehold(data);
      addToast(`Joined ${data.name}! Welcome 🏡`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join household', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        {/* Step indicator */}
        <div className="step-indicator">
          <div className="step-dot active" />
          <div className="step-dot active" />
        </div>

        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🏘️</div>
        <h1 className="text-headline-lg" style={{ marginBottom: 'var(--space-2)' }}>
          Choose your household
        </h1>
        <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
          Select the household you belong to. You'll be added as a member right away.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-outline)' }}>
              Loading households…
            </div>
          ) : households.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 'var(--space-8)',
              background: 'var(--color-surface-container-low)',
              borderRadius: 'var(--radius-xl)',
              color: 'var(--color-outline)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🏚️</div>
              <div style={{ fontWeight: 600 }}>No households found</div>
              <div style={{ fontSize: 'var(--text-label-md)', marginTop: 4 }}>
                Contact your admin to set one up first.
              </div>
            </div>
          ) : (
            <>
              {/* Household cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {households.map((h) => {
                  const isSelected = h._id === selectedId;
                  return (
                    <button
                      key={h._id}
                      type="button"
                      onClick={() => setSelectedId(h._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-4)',
                        padding: 'var(--space-4) var(--space-5)',
                        borderRadius: 'var(--radius-xl)',
                        border: isSelected
                          ? '2px solid var(--color-primary)'
                          : '2px solid var(--color-outline-variant)',
                        background: isSelected
                          ? 'var(--color-primary-fixed)'
                          : 'var(--color-surface-container-lowest)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all var(--duration-fast) var(--ease-out)',
                        boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                        background: isSelected ? 'var(--color-primary-container)' : 'var(--color-surface-container)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                        transition: 'background var(--duration-fast)',
                      }}>
                        🏠
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 'var(--text-body-md)',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-on-surface)',
                        }}>
                          {h.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-outline)', marginTop: 2 }}>
                          {h.memberCount} {h.memberCount === 1 ? 'member' : 'members'} · {h.currency}
                        </div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-outline-variant)',
                        background: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all var(--duration-fast)',
                      }}>
                        {isSelected && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!selectedId || joining}
                style={{ marginTop: 'var(--space-2)' }}
              >
                {joining ? 'Joining…' : selected ? `Join "${selected.name}" →` : 'Select a household'}
              </button>
            </>
          )}
        </form>

        <p className="text-center text-muted" style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-label-sm)' }}>
          Step 2 of 2
        </p>
      </div>
    </div>
  );
}
