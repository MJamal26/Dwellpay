import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, CATEGORY_MAP } from '../utils/helpers';
import MemberAvatar from './MemberAvatar';

export default function ExpenseDetailModal({ expenseId, onClose }) {
  const { household } = useAuthStore();
  const currency = household?.currency || 'INR';

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => api.get(`/expenses/${expenseId}`).then((r) => r.data),
    enabled: !!expenseId,
  });

  if (!expenseId) return null;

  const cat = expense ? CATEGORY_MAP[expense.category] || { emoji: '📦', label: expense.category } : null;

  return (
    // Backdrop
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

            {/* Split among */}
            <div className="modal-section">
              <div className="modal-section-label">
                Split among {expense.splits?.length || 0} member{expense.splits?.length !== 1 ? 's' : ''}
              </div>
              <div className="modal-splits-list">
                {expense.splits?.map((sp) => (
                  <div key={sp.userId?._id || sp.userId} className="modal-split-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <MemberAvatar user={sp.userId} size="sm" />
                      <span className="modal-split-name">{sp.userId?.name || 'Member'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span className="modal-split-amount">{formatCurrency(sp.amount, currency)}</span>
                      <span className={`badge ${sp.settled ? 'badge-positive' : 'badge-neutral'}`}>
                        {sp.settled ? 'Settled' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
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
