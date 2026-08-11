import CategoryBadge from './CategoryBadge';
import MemberAvatar from './MemberAvatar';
import { formatCurrency, formatDateShort } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';

export default function ExpenseCard({ expense, onClick, highlighted }) {
  const { user, household } = useAuthStore();
  const currency = household?.currency || 'INR';

  const myId = user?._id;
  const paidByMe = expense.paidBy?._id === myId || expense.paidBy === myId;

  // Find my share
  const mySplit = expense.splits?.find(
    (s) => s.userId?._id === myId || s.userId === myId
  );
  const myShare = mySplit?.amount || 0;

  return (
    <div
      className={`expense-item ${highlighted ? 'highlighted' : ''}`}
      onClick={() => onClick?.(expense)}
    >
      <CategoryBadge category={expense.category} />

      <div className="expense-info">
        <div className="expense-name">{expense.description}</div>
        <div className="expense-meta">
          {paidByMe ? 'You paid' : `${expense.paidBy?.name} paid`}
          {' · '}
          {formatDateShort(expense.date)}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          className="expense-amount"
          style={{ color: paidByMe ? 'var(--color-positive)' : 'var(--color-on-surface)' }}
        >
          {formatCurrency(expense.amount, currency)}
        </div>
        {mySplit && (
          <div className="text-muted" style={{ fontSize: 'var(--text-caption)', marginTop: 2 }}>
            Your share: {formatCurrency(myShare, currency)}
          </div>
        )}
      </div>
    </div>
  );
}
