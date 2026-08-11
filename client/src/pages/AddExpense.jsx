import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { CATEGORIES, formatCurrency } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';

export default function AddExpense({ inSheet = false, onSuccess }) {
  const { user, household } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: editId } = useParams();

  const currency = household?.currency || 'INR';
  const currSymbol = currency === 'USD' ? '$' : '₹';

  // Always fetch fresh household so newly added members appear
  const { data: freshHousehold } = useQuery({
    queryKey: ['household', household?._id],
    queryFn: () => api.get(`/households/${household._id}`).then((r) => r.data),
    enabled: !!household?._id,
    staleTime: 0,
  });

  const allMembers = (freshHousehold || household)?.members
    ?.map((m) => m.userId)
    .filter(Boolean) || [];

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'other',
    paidBy: user?._id || '',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal',
    notes: '',
  });

  const [includedIds, setIncludedIds] = useState([]);
  const [customSplits, setCustomSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Once members load, default to all included
  useEffect(() => {
    if (allMembers.length > 0 && includedIds.length === 0) {
      setIncludedIds(allMembers.map((m) => m._id || m));
    }
  }, [allMembers.length]);

  const includedMembers = allMembers.filter((m) => includedIds.includes(m._id || m));
  const amountNum = parseFloat(form.amount) || 0;

  // Recalc equal splits on amount / member change
  useEffect(() => {
    if (includedMembers.length > 0 && form.splitType === 'equal') {
      const share = amountNum / includedMembers.length;
      setCustomSplits(
        includedMembers.map((m, idx) => ({
          userId: m._id || m,
          amount: parseFloat(
            (idx === 0 ? amountNum - share * (includedMembers.length - 1) : share).toFixed(2)
          ),
          percentage: parseFloat((100 / includedMembers.length).toFixed(2)),
        }))
      );
    }
  }, [form.amount, form.splitType, includedIds]);

  // Init custom amounts when switching to custom mode
  useEffect(() => {
    if (form.splitType === 'custom' && includedMembers.length > 0) {
      const share = amountNum / includedMembers.length;
      setCustomSplits(
        includedMembers.map((m, idx) => ({
          userId: m._id || m,
          amount: parseFloat(
            (idx === 0 ? amountNum - share * (includedMembers.length - 1) : share).toFixed(2)
          ),
          percentage: parseFloat((100 / includedMembers.length).toFixed(2)),
        }))
      );
    }
  }, [form.splitType]);

  const toggleMember = (mId) =>
    setIncludedIds((prev) =>
      prev.includes(mId) ? prev.filter((id) => id !== mId) : [...prev, mId]
    );

  const allSelected = allMembers.length > 0 && allMembers.every((m) => includedIds.includes(m._id || m));

  const handleSelectAll = () => {
    setIncludedIds(allSelected ? [] : allMembers.map((m) => m._id || m));
  };

  const totalCustom = customSplits.reduce((s, sp) => s + (sp.amount || 0), 0);
  const splitError = form.splitType === 'custom' && amountNum > 0 && Math.abs(totalCustom - amountNum) > 0.5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountNum || amountNum <= 0) { addToast('Enter a valid amount', 'error'); return; }
    if (includedMembers.length === 0) { addToast('Select at least one member', 'error'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: amountNum,
        currency,
        splits: customSplits.length > 0 ? customSplits : undefined,
      };
      if (editId) {
        await api.put(`/expenses/${editId}`, payload);
        addToast('Expense updated!', 'success');
      } else {
        await api.post('/expenses', payload);
        addToast('Expense added! 🎉', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (onSuccess) onSuccess();
      else navigate('/expenses');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-expense-container">
      <form onSubmit={handleSubmit} className="add-expense-form">

        {/* Header */}
        <h2 className="add-expense-title">
          {editId ? 'Edit expense' : 'Add expense'}
        </h2>

        {/* Amount */}
        <div className="ae-amount-block">
          <div className="ae-amount-label">Amount ({currSymbol})</div>
          <input
            type="number"
            min="0"
            step="0.01"
            className="ae-amount-input"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </div>

        {/* Description */}
        <div className="ae-field">
          <label className="ae-label">What was this for?</label>
          <input
            className="ae-input"
            placeholder="Electricity bill, dinner..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        {/* Category */}
        <div className="ae-field">
          <label className="ae-label">Category</label>
          <div className="ae-category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`ae-cat-btn${form.category === cat.key ? ' selected' : ''}`}
                onClick={() => setForm({ ...form, category: cat.key })}
              >
                <span className="ae-cat-icon">{cat.emoji}</span>
                <span className="ae-cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Split with */}
        {allMembers.length > 0 && (
          <div className="ae-field">
            <div className="ae-split-header">
              <label className="ae-label" style={{ marginBottom: 0 }}>Split with</label>
              <button
                type="button"
                className="ae-select-all-btn"
                onClick={handleSelectAll}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="ae-avatars-row">
              {allMembers.map((m) => {
                const mId = m._id || m;
                const isIn = includedIds.includes(mId);
                return (
                  <button
                    key={mId}
                    type="button"
                    className={`ae-avatar-btn${isIn ? ' included' : ''}`}
                    onClick={() => toggleMember(mId)}
                  >
                    <MemberAvatar user={m} size="md" />
                    <span className="ae-avatar-name">
                      {(m.name || 'Member').split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Per-person share hint */}
            {includedMembers.length > 0 && amountNum > 0 && form.splitType === 'equal' && (
              <div className="ae-split-hint">
                {currSymbol}{(amountNum / includedMembers.length).toFixed(2)} each · {includedMembers.length} member{includedMembers.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <div className="ae-field">
          <label className="ae-label">Date</label>
          <input
            type="date"
            className="ae-input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

        {/* Split type toggle (shows only when >1 member included) */}
        {includedMembers.length > 1 && (
          <div className="ae-field">
            <label className="ae-label">How to split</label>
            <div className="ae-split-toggle">
              <button
                type="button"
                className={`ae-split-btn${form.splitType === 'equal' ? ' active' : ''}`}
                onClick={() => setForm({ ...form, splitType: 'equal' })}
              >
                ⚡ Equal
              </button>
              <button
                type="button"
                className={`ae-split-btn${form.splitType === 'custom' ? ' active' : ''}`}
                onClick={() => setForm({ ...form, splitType: 'custom' })}
              >
                ✏️ Custom
              </button>
            </div>
          </div>
        )}

        {/* Custom amounts */}
        {form.splitType === 'custom' && includedMembers.length > 1 && (
          <div className="ae-field">
            <label className="ae-label">Custom amounts</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {customSplits.map((sp, idx) => {
                const member = allMembers.find((m) => (m._id || m) === sp.userId);
                return (
                  <div key={sp.userId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <MemberAvatar user={member} size="sm" />
                    <span style={{ flex: 1, fontSize: 'var(--text-label-md)', fontWeight: 500 }}>
                      {member?.name || 'Member'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--color-outline)' }}>{currSymbol}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sp.amount}
                        onChange={(e) => {
                          const updated = [...customSplits];
                          updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value) || 0 };
                          setCustomSplits(updated);
                        }}
                        className="ae-input"
                        style={{ width: 90, textAlign: 'right', fontFamily: 'var(--font-headline)', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                );
              })}
              {splitError && (
                <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-caption)', fontWeight: 500 }}>
                  ⚠ Total ({currSymbol}{totalCustom.toFixed(2)}) doesn't match ({currSymbol}{amountNum.toFixed(2)})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="ae-field">
          <label className="ae-label">Notes (optional)</label>
          <textarea
            className="ae-input"
            placeholder="Any additional notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="ae-submit-btn"
          disabled={loading || splitError || includedMembers.length === 0}
        >
          {loading ? 'Saving...' : `+ ${editId ? 'Update' : 'Add'} expense`}
        </button>

        {/* Cancel */}
        <button
          type="button"
          className="ae-cancel-btn"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
        >
          Cancel
        </button>

      </form>
    </div>
  );
}
