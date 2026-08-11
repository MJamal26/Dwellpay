import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';
import CategoryBadge from '../components/CategoryBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BalanceDetails() {
  const { memberId } = useParams();
  const { user, household } = useAuthStore();
  const navigate = useNavigate();
  const currency = household?.currency || 'INR';

  const [showSettleModal, setShowSettleModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['balances', memberId],
    queryFn: () => api.get(`/balances/${memberId}`).then((r) => r.data),
  });

  const net = data?.net || 0;
  const expenses = data?.expenses || [];

  // Get member info from household
  const member = household?.members
    ?.map((m) => m.userId)
    .find((m) => (m?._id || m) === memberId);

  // net < 0: I owe them → show Settle Up
  const iOweThem = net < 0;
  const amountOwed = Math.abs(net);

  const handleSettleUp = () => {
    // Build UPI deep link — pa (payee UPI ID) is placeholder until configured per-user
    const upiId = member?.upiId || ''; // future: stored per user
    const name = encodeURIComponent(member?.name || 'Housemate');
    const amount = amountOwed.toFixed(2);
    const note = encodeURIComponent(`DwellPay: Settling up with ${member?.name}`);
    const upiLink = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=${currency}&tn=${note}`;
    window.location.href = upiLink;
  };

  return (
    <div>
      <div className="page-header">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/balances')}
        >
          ← Back
        </button>
      </div>

      {/* Header card */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-6)',
          background: iOweThem
            ? 'linear-gradient(135deg, var(--color-negative-bg), var(--color-surface-container-lowest))'
            : net > 0
              ? 'linear-gradient(135deg, var(--color-positive-bg), var(--color-surface-container-lowest))'
              : 'var(--color-surface-container-low)',
        }}
      >
        {/* Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <MemberAvatar user={user} size="lg" />
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--color-outline)', fontSize: 24 }}>⇌</div>
          <MemberAvatar user={member} size="lg" />
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-outline)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
            {net > 0
              ? `${member?.name} owes you`
              : net < 0
                ? `You owe ${member?.name}`
                : '✓ All settled up!'}
          </div>
          <div style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2.5rem',
            fontWeight: 800,
            color: net > 0 ? 'var(--color-positive)' : net < 0 ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-outline)',
          }}>
            {formatCurrency(amountOwed, currency)}
          </div>
        </div>

        {/* Settle Up — only shown when current user owes */}
        {iOweThem && (
          <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowSettleModal(true)}
              style={{ minWidth: 180 }}
            >
              💸 Settle Up
            </button>
          </div>
        )}

        {/* Owed to me note */}
        {net > 0 && (
          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-label-sm)', color: 'var(--color-outline)' }}>
            Waiting for {member?.name} to pay you back
          </div>
        )}
      </div>

      {/* Shared expenses */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h2 className="section-title">Shared Expenses</h2>
          {expenses.length === 0 ? (
            <div className="text-muted text-center" style={{ padding: 'var(--space-8)' }}>
              No shared expenses found
            </div>
          ) : (
            expenses.map((exp) => {
              const paidByMe = (exp.paidBy?._id || exp.paidBy)?.toString() === user?._id?.toString();
              const myId = user?._id?.toString();
              const othId = memberId;

              // When they paid: my split = what I owe them
              // When I paid: their split = what they owe me
              const relevantSplit = paidByMe
                ? exp.splits?.find((s) => (s.userId?._id || s.userId)?.toString() === othId)
                : exp.splits?.find((s) => (s.userId?._id || s.userId)?.toString() === myId);

              const settled = relevantSplit?.settled;

              return (
                <div key={exp._id} className="expense-item">
                  <CategoryBadge category={exp.category} />
                  <div className="expense-info">
                    <div className="expense-name">{exp.description}</div>
                    <div className="expense-meta">
                      {paidByMe ? 'You paid' : `${exp.paidBy?.name} paid`} · {formatDate(exp.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="expense-amount">{formatCurrency(exp.amount, currency)}</div>
                    {relevantSplit && (
                      <div style={{ fontSize: 'var(--text-caption)', marginTop: 2, color: settled ? 'var(--color-positive)' : 'var(--color-tertiary-fixed-dim)', fontWeight: 600 }}>
                        {settled
                          ? '✓ settled'
                          : paidByMe
                            ? `They owe: ${formatCurrency(relevantSplit.amount, currency)}`
                            : `You owe: ${formatCurrency(relevantSplit.amount, currency)}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Settle Up Modal */}
      {showSettleModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowSettleModal(false)}
        >
          <div
            style={{
              background: 'var(--color-surface-container-lowest)',
              borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
              padding: 'var(--space-6)',
              width: '100%',
              maxWidth: 480,
              paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: 'var(--color-outline-variant)', borderRadius: 2, margin: '0 auto var(--space-5)' }} />

            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <MemberAvatar user={member} size="xl" />
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'var(--text-headline-md)', marginTop: 'var(--space-3)' }}>
                Pay {member?.name}
              </div>
              <div style={{ color: 'var(--color-outline)', fontSize: 'var(--text-label-md)', marginTop: 4 }}>
                {member?.email}
              </div>
            </div>

            <div style={{
              background: 'var(--color-negative-bg)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              textAlign: 'center',
              marginBottom: 'var(--space-6)',
            }}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
                Amount Due
              </div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-tertiary-fixed-dim)' }}>
                {formatCurrency(amountOwed, currency)}
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 'var(--text-body-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}
              onClick={handleSettleUp}
            >
              🚀 Open UPI App to Pay
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setShowSettleModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
