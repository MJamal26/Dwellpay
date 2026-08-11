import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, CATEGORY_MAP } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToastStore } from '../store/toastStore';

// ─── Admin view ─────────────────────────────────────────────────────────────
function AdminBalancesView({ household, currency }) {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [settlingId, setSettlingId] = useState(null); // "expId-userId"
  const [expandedMember, setExpandedMember] = useState(null);

  const { data: expData, isLoading } = useQuery({
    queryKey: ['admin-expenses'],
    queryFn: () => api.get('/expenses?limit=200').then((r) => r.data),
    staleTime: 0,
  });

  const { data: balances } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/balances').then((r) => r.data),
  });

  const allExpenses = expData?.expenses || [];
  const members = household?.members?.map((m) => m.userId).filter(Boolean) || [];

  // Group expenses by member (expenses where this member has a pending split)
  const memberExpenses = members.map((m) => {
    const mId = m._id || m;
    const relevant = allExpenses.filter((exp) => {
      const split = exp.splits?.find((s) => (s.userId?._id || s.userId) === mId);
      const isPayer = (exp.paidBy?._id || exp.paidBy) === mId;
      return split && !isPayer; // show expenses where this member OWES (not ones they paid)
    });
    const pending = relevant.filter((exp) => {
      const split = exp.splits?.find((s) => (s.userId?._id || s.userId) === mId);
      return split && !split.settled;
    });
    const balance = balances?.find((b) => (b.userId?._id || b.userId) === mId);
    return { member: m, mId, allExpenses: relevant, pendingExpenses: pending, balance };
  });

  const handleSettle = async (expId, splitUserId, currentSettled) => {
    const key = `${expId}-${splitUserId}`;
    setSettlingId(key);
    try {
      await api.patch(`/expenses/${expId}/settle/${splitUserId}`);
      queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      addToast(currentSettled ? 'Marked as unpaid' : 'Marked as paid ✓', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSettlingId(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const totalPending = memberExpenses.reduce((s, m) => s + m.pendingExpenses.length, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Admin Overview</h1>
        <span className="badge badge-neutral">{totalPending} pending</span>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Members</div>
          <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.5rem' }}>{members.length}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Expenses</div>
          <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.5rem' }}>{allExpenses.length}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pending</div>
          <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.5rem', color: totalPending > 0 ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-positive)' }}>{totalPending}</div>
        </div>
      </div>

      {/* Per-member panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {memberExpenses.map(({ member, mId, allExpenses: memberExps, pendingExpenses, balance }) => {
          const isExpanded = expandedMember === mId;
          const net = balance?.net || 0;

          return (
            <div key={mId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Member header row */}
              <button
                type="button"
                onClick={() => setExpandedMember(isExpanded ? null : mId)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-4)', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <MemberAvatar user={member} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface)' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', marginTop: 2 }}>
                    {pendingExpenses.length > 0
                      ? `${pendingExpenses.length} payment${pendingExpenses.length !== 1 ? 's' : ''} pending`
                      : '✓ All settled'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 'var(--space-2)' }}>
                  <div style={{
                    fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'var(--text-body-lg)',
                    color: net < 0 ? 'var(--color-tertiary-fixed-dim)' : net > 0 ? 'var(--color-positive)' : 'var(--color-outline)',
                  }}>
                    {net < 0 ? '-' : net > 0 ? '+' : ''}{formatCurrency(Math.abs(net), currency)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-outline)' }}>
                    {net < 0 ? 'owes' : net > 0 ? 'is owed' : 'settled'}
                  </div>
                </div>
                <span style={{ color: 'var(--color-outline)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none', fontSize: 18 }}>›</span>
              </button>

              {/* Expanded expense list */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--color-surface-container-high)' }}>
                  {memberExps.length === 0 ? (
                    <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-outline)', fontSize: 'var(--text-label-sm)' }}>
                      No shared expenses with this member
                    </div>
                  ) : (
                    memberExps.map((exp) => {
                      const split = exp.splits?.find((s) => (s.userId?._id || s.userId) === mId);
                      if (!split) return null;
                      const isSettled = split.settled;
                      const cat = CATEGORY_MAP[exp.category] || { emoji: '📦' };
                      const settleKey = `${exp._id}-${mId}`;
                      const isLoading = settlingId === settleKey;

                      return (
                        <div
                          key={exp._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderBottom: '1px solid var(--color-surface-container)',
                            background: isSettled ? 'transparent' : 'rgba(251,146,60,0.04)',
                          }}
                        >
                          {/* Category */}
                          <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{cat.emoji}</div>

                          {/* Description + date */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exp.description}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-outline)', marginTop: 2 }}>
                              {formatDate(exp.date)} · paid by {exp.paidBy?.name?.split(' ')[0]}
                            </div>
                          </div>

                          {/* Amount */}
                          <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 'var(--text-label-md)', color: isSettled ? 'var(--color-outline)' : 'var(--color-on-surface)', flexShrink: 0 }}>
                            {formatCurrency(split.amount, currency)}
                          </div>

                          {/* Settle button */}
                          <button
                            className={`settle-btn${isSettled ? ' settled' : ''}`}
                            onClick={() => handleSettle(exp._id, mId, isSettled)}
                            disabled={!!isLoading}
                          >
                            {isLoading ? '…' : isSettled ? '✓ Paid' : 'Mark paid'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Regular user view ────────────────────────────────────────────────────────
export default function Balances() {
  const { user, household } = useAuthStore();
  const navigate = useNavigate();
  const currency = household?.currency || 'INR';
  const myId = user?._id;
  const isAdmin = !!user?.isHidden;

  const [activeTab, setActiveTab] = useState('owe');

  const { data: balances, isLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/balances').then((r) => r.data),
    enabled: !!household,
  });

  // Admin gets full overview
  if (isAdmin) {
    return <AdminBalancesView household={household} currency={currency} />;
  }

  const others = balances?.filter((b) => (b.userId?._id || b.userId) !== myId) || [];

  const iOwe = others.filter((b) => b.net < 0);
  const owedToMe = others.filter((b) => b.net > 0);

  const totalIOwe = iOwe.reduce((s, b) => s + Math.abs(b.net), 0);
  const totalOwedToMe = owedToMe.reduce((s, b) => s + b.net, 0);
  const myNet = others.reduce((s, b) => s + (b.net || 0), 0);

  const list = activeTab === 'owe' ? iOwe : owedToMe;

  return (
    <div>
      <div className="page-header">
        <h1>Balances</h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--color-negative-bg), var(--color-surface-container-lowest))',
            padding: 'var(--space-5)', textAlign: 'center', cursor: 'pointer',
            border: activeTab === 'owe' ? '2px solid var(--color-tertiary-fixed-dim)' : '2px solid transparent',
            transition: 'border var(--duration-fast)',
          }}
          onClick={() => setActiveTab('owe')}
        >
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>You Owe</div>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-tertiary-fixed-dim)' }}>{formatCurrency(totalIOwe, currency)}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', marginTop: 'var(--space-1)' }}>to {iOwe.length} {iOwe.length === 1 ? 'person' : 'people'}</div>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--color-positive-bg), var(--color-surface-container-lowest))',
            padding: 'var(--space-5)', textAlign: 'center', cursor: 'pointer',
            border: activeTab === 'owed' ? '2px solid var(--color-positive)' : '2px solid transparent',
            transition: 'border var(--duration-fast)',
          }}
          onClick={() => setActiveTab('owed')}
        >
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>Owed to You</div>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-positive)' }}>{formatCurrency(totalOwedToMe, currency)}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', marginTop: 'var(--space-1)' }}>from {owedToMe.length} {owedToMe.length === 1 ? 'person' : 'people'}</div>
        </div>
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-full)', padding: 4 }}>
        <button
          onClick={() => setActiveTab('owe')}
          style={{
            flex: 1, padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-label-md)',
            transition: 'all var(--duration-fast)',
            background: activeTab === 'owe' ? 'var(--color-surface-container-lowest)' : 'transparent',
            color: activeTab === 'owe' ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-outline)',
            boxShadow: activeTab === 'owe' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          💸 I Owe {iOwe.length > 0 && <span style={{ background: 'var(--color-negative-bg)', borderRadius: 'var(--radius-full)', padding: '1px 6px', marginLeft: 4, fontSize: 'var(--text-caption)' }}>{iOwe.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('owed')}
          style={{
            flex: 1, padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-label-md)',
            transition: 'all var(--duration-fast)',
            background: activeTab === 'owed' ? 'var(--color-surface-container-lowest)' : 'transparent',
            color: activeTab === 'owed' ? 'var(--color-positive)' : 'var(--color-outline)',
            boxShadow: activeTab === 'owed' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          🤝 Owed to Me {owedToMe.length > 0 && <span style={{ background: 'var(--color-positive-bg)', borderRadius: 'var(--radius-full)', padding: '1px 6px', marginLeft: 4, fontSize: 'var(--text-caption)' }}>{owedToMe.length}</span>}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : list.length === 0 ? (
        <EmptyState
          icon={activeTab === 'owe' ? '🎉' : '⏳'}
          title={activeTab === 'owe' ? "You don't owe anyone!" : 'Nobody owes you yet'}
          description={activeTab === 'owe' ? "You're all squared up with your housemates" : 'Add expenses with housemates to track balances'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {list.map((b) => {
            const memberId = b.userId?._id || b.userId;
            const amount = Math.abs(b.net);
            return (
              <div
                key={memberId}
                className="balance-card"
                onClick={() => navigate(`/balances/${memberId}`)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: activeTab === 'owe' ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-positive)', borderRadius: '4px 0 0 4px' }} />
                <div style={{ paddingLeft: 'var(--space-3)' }}><MemberAvatar user={b.userId} size="md" /></div>
                <div className="balance-info">
                  <div className="balance-name">{b.userId?.name || 'Member'}</div>
                  <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-outline)', marginTop: 2 }}>
                    {activeTab === 'owe' ? 'Tap to see details & pay' : 'Tap to view shared expenses'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="balance-amount" style={{ color: activeTab === 'owe' ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-positive)' }}>
                    {formatCurrency(amount, currency)}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', marginTop: 2 }}>
                    {activeTab === 'owe' ? 'you owe' : 'owes you'}
                  </div>
                </div>
                <span style={{ color: 'var(--color-outline)', fontSize: 20 }}>›</span>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && others.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-outline)', fontWeight: 500 }}>Net position</span>
          <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'var(--text-body-lg)', color: myNet >= 0 ? 'var(--color-positive)' : 'var(--color-tertiary-fixed-dim)' }}>
            {myNet >= 0 ? '+' : '-'}{formatCurrency(Math.abs(myNet), currency)}
          </span>
        </div>
      )}
    </div>
  );
}
