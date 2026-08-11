import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/helpers';
import ExpenseCard from '../components/ExpenseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import DatePicker from '../components/DatePicker';
import ExpenseDetailModal from '../components/ExpenseDetailModal';

export default function Expenses() {
  const { household } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  // Initialise from URL ?date=YYYY-MM-DD if navigated from mini-calendar
  const urlDate = searchParams.get('date');
  const initValue = (() => {
    if (!urlDate) {
      const n = new Date();
      return { year: n.getFullYear(), month: n.getMonth() + 1 };
    }
    const [y, m, d] = urlDate.split('-').map(Number);
    return { year: y, month: m, day: d };
  })();

  const [dateFilter, setDateFilter] = useState(initValue);

  const buildParams = () => {
    if (!dateFilter) return '';
    if (dateFilter.day) {
      const pad = (n) => String(n).padStart(2, '0');
      return `&date=${dateFilter.year}-${pad(dateFilter.month)}-${pad(dateFilter.day)}`;
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `&month=${dateFilter.year}-${pad(dateFilter.month)}`;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', 'filtered', JSON.stringify(dateFilter)],
    queryFn: () => api.get(`/expenses?limit=200${buildParams()}`).then((r) => r.data),
    enabled: !!household,
  });

  const expenses = data?.expenses || [];

  const grouped = {};
  for (const exp of expenses) {
    const key = formatDate(exp.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(exp);
  }

  const getPeriodLabel = () => {
    if (!dateFilter) return 'All time';
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (dateFilter.day)
      return `${MONTHS[dateFilter.month - 1]} ${dateFilter.day}, ${dateFilter.year}`;
    return `${MONTHS[dateFilter.month - 1]} ${dateFilter.year}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="btn btn-primary" onClick={() => navigate('/expenses/add')}>
          + Add Expense
        </button>
      </div>

      {/* Date picker filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="All time" />
        {expenses.length > 0 && (
          <span style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-outline)', marginLeft: 'auto' }}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No expenses found"
          description={`No expenses for ${getPeriodLabel()}`}
          action={
            <button className="btn btn-primary" onClick={() => navigate('/expenses/add')}>
              + Add Expense
            </button>
          }
        />
      ) : (
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          {Object.entries(grouped).map(([dateStr, exps]) => (
            <div key={dateStr}>
              <div className="date-group-header">{dateStr}</div>
              {exps.map((exp) => (
                <ExpenseCard
                  key={exp._id}
                  expense={exp}
                  onClick={() => setSelectedExpenseId(exp._id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Expense detail modal */}
      <ExpenseDetailModal
        expenseId={selectedExpenseId}
        onClose={() => setSelectedExpenseId(null)}
      />
    </div>
  );
}
