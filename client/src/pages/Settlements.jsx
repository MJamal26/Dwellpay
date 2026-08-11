import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settlements() {
  const { household, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const currency = household?.currency || 'INR';

  const [confirmSettlement, setConfirmSettlement] = useState(null);
  const [settling, setSettling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => api.get('/settlements').then((r) => r.data),
    enabled: !!household,
  });

  const suggestions = data?.suggestions || [];
  const history = data?.history || [];

  const handleSettle = async () => {
    if (!confirmSettlement) return;
    setSettling(true);
    try {
      // Create a settlement record and mark it immediately
      const res = await api.post('/settlements', {
        toUser: confirmSettlement.to._id || confirmSettlement.to,
        amount: confirmSettlement.amount,
        currency,
        note: 'Settled via DwellPay',
      });
      await api.put(`/settlements/${res.data._id}/settle`);
      addToast('Settlement recorded! 🎉', 'success');
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    } catch (err) {
      addToast('Failed to record settlement', 'error');
    } finally {
      setSettling(false);
      setConfirmSettlement(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settlements</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Suggestions */}
          <h2 className="section-title">Suggested Payments</h2>
          {suggestions.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="All settled up!"
              description="No payments needed. Everyone is square."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              {suggestions.map((s, idx) => (
                <div key={idx} className="settlement-card">
                  <MemberAvatar user={s.from} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-body-md)' }}>
                      {s.from?.name || 'Someone'}
                    </div>
                    <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-outline)' }}>
                      pays
                    </div>
                  </div>
                  <div className="settlement-arrow">→</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-body-md)' }}>
                      {s.to?.name || 'Someone'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-headline)',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: 'var(--color-positive)',
                      }}
                    >
                      {formatCurrency(s.amount, currency)}
                    </div>
                  </div>
                  <MemberAvatar user={s.to} size="md" />
                  {/* Show "Mark Paid" only if current user is the debtor */}
                  {(s.from?._id === user?._id || s.from === user?._id) && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setConfirmSettlement(s)}
                      style={{ marginLeft: 'var(--space-3)' }}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <>
              <h2 className="section-title">Settlement History</h2>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                {history.map((s) => (
                  <div key={s._id} className="expense-item">
                    <span style={{ fontSize: 32 }}>✅</span>
                    <div className="expense-info">
                      <div className="expense-name">
                        {s.fromUser?.name} → {s.toUser?.name}
                      </div>
                      <div className="expense-meta">Settled · {formatDate(s.settledAt)}</div>
                    </div>
                    <div className="expense-amount" style={{ color: 'var(--color-positive)' }}>
                      {formatCurrency(s.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {confirmSettlement && (
        <ConfirmDialog
          title="Confirm Settlement"
          message={`Mark that you've paid ${formatCurrency(confirmSettlement.amount, currency)} to ${confirmSettlement.to?.name}?`}
          confirmLabel="Yes, Mark Paid"
          confirmVariant="btn-primary"
          onConfirm={handleSettle}
          onCancel={() => setConfirmSettlement(null)}
          isLoading={settling}
        />
      )}
    </div>
  );
}
