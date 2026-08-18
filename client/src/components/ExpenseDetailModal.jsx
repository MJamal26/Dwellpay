import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { formatCurrency, formatDate, CATEGORY_MAP } from '../utils/helpers';
import MemberAvatar from './MemberAvatar';

export default function ExpenseDetailModal({ expenseId, onClose }) {
  const { household, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const currency = household?.currency || 'INR';
  const [settlingId, setSettlingId] = useState(null); // which split is being toggled

  // Check if current user is owner
  const myMembership = household?.members?.find(
    (m) => (m.userId?._id || m.userId) === user?._id
  );
  const isOwner = myMembership?.role === 'owner';

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => api.get(`/expenses/${expenseId}`).then((r) => r.data),
    enabled: !!expenseId,
  });

  if (!expenseId) return null;

  const cat = expense
    ? CATEGORY_MAP[expense.category] || { emoji: '📦', label: expense.category }
    : null;

  const handleSettle = async (splitUserId, currentSettled) => {
    setSettlingId(splitUserId);
    try {
      await api.patch(`/expenses/${expenseId}/settle/${splitUserId}`);
      // Refresh this expense + balances
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      addToast(
        currentSettled ? 'Marked as unpaid' : 'Marked as paid ✓',
        'success'
      );
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSettlingId(null);
    }
  };

  // Check whether payer's own split should show as "paid" automatically
  const payerId = expense?.paidBy?._id || expense?.paidBy;

  // Can settle: household owner (admin) OR whoever paid for this expense
  const isExpensePayer = expense ? (payerId === user?._id) : false;
  const canSettle = isOwner || isExpensePayer;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="modal-close-btn" onClick={onClose} type="button">✕</button>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-outline)' }}>
            Loading…
          </div>
        ) : expense ? (
          <>
            {/* Category icon + name */}
            <div className="modal-cat-row">
              <div className="modal-cat-icon">{cat.emoji}</div>
              <div>
                <div className="modal-cat-label">{cat.label}</div>
                <h2 className="modal-expense-name">{expense.description}</h2>
              </div>
            </div>

            {/* Amount */}
            <div className="modal-amount">
              {formatCurrency(expense.amount, currency)}
            </div>

            {/* Date */}
            <div className="modal-meta">{formatDate(expense.date)}</div>

            <div className="modal-divider" />

            {/* Paid by */}
            <div className="modal-section">
              <div className="modal-section-label">Paid by</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <MemberAvatar user={expense.paidBy} size="sm" />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-label-md)' }}>
                  {expense.paidBy?.name || '—'}
                </span>
              </div>
            </div>

            <div className="modal-divider" />

            {/* Splits */}
            <div className="modal-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="modal-section-label">
                  Split among {expense.splits?.length || 0} member{expense.splits?.length !== 1 ? 's' : ''}
                </div>
                {canSettle && (
                  <span style={{ fontSize: 10, color: 'var(--color-outline)', fontStyle: 'italic' }}>
                    tap ✓ to mark paid
                  </span>
                )}
              </div>

              <div className="modal-splits-list">
                {expense.splits?.map((sp) => {
                  const spUserId = sp.userId?._id || sp.userId;
                  const isPayer = spUserId === payerId;
                  // Payer's split is implicitly settled
                  const isSettled = sp.settled || isPayer;
                  const isLoading = settlingId === spUserId;

                  return (
                    <div key={spUserId} className="modal-split-row">
                      {/* Left: avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <MemberAvatar user={sp.userId} size="sm" />
                        <div>
                          <div className="modal-split-name">{sp.userId?.name || 'Member'}</div>
                          {isPayer && (
                            <div style={{ fontSize: 10, color: 'var(--color-outline)' }}>paid</div>
                          )}
                        </div>
                      </div>

                      {/* Right: amount + badge + settle btn */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="modal-split-amount">
                          {formatCurrency(sp.amount, currency)}
                        </span>

                        {/* Settle toggle — expense creator or owner, not for the payer row (already paid) */}
                        {canSettle && !isPayer ? (
                          <button
                            className={`settle-btn${isSettled ? ' settled' : ''}`}
                            onClick={() => handleSettle(spUserId, sp.settled)}
                            disabled={isLoading}
                            title={isSettled ? 'Mark as unpaid' : 'Mark as paid'}
                          >
                            {isLoading ? '…' : isSettled ? '✓ Paid' : 'Mark paid'}
                          </button>
                        ) : (
                          <span className={`badge ${isSettled ? 'badge-positive' : 'badge-neutral'}`}>
                            {isSettled ? 'Paid' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {expense.notes && (
              <>
                <div className="modal-divider" />
                <div className="modal-section">
                  <div className="modal-section-label">Notes</div>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
                    {expense.notes}
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-outline)' }}>
            Expense not found
          </div>
        )}
      </div>
    </div>
  );
}
