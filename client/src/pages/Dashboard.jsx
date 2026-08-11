import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, CATEGORY_MAP } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';
import CategoryBadge from '../components/CategoryBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import MiniCalendar from '../components/MiniCalendar';

const CHART_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#059669', '#0891b2', '#0284c7',
  '#84cc16', '#f97316', '#8b5cf6', '#64748b',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user, household } = useAuthStore();
  const navigate = useNavigate();
  const currency = household?.currency || 'INR';

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  const { data: recentData, isLoading: expLoading } = useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: () => api.get('/expenses?limit=6').then((r) => r.data),
    enabled: !!household,
  });

  const { data: todayData } = useQuery({
    queryKey: ['expenses', 'today', todayStr],
    queryFn: () => api.get(`/expenses?date=${todayStr}&limit=100`).then((r) => r.data),
    enabled: !!household,
  });

  const { data: monthData } = useQuery({
    queryKey: ['expenses', 'month', monthKey],
    queryFn: () => api.get(`/expenses?month=${monthKey}&limit=200`).then((r) => r.data),
    enabled: !!household,
  });

  const { data: balances } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/balances').then((r) => r.data),
    enabled: !!household,
  });

  const myId = user?._id;
  const myBalance = balances?.find((b) => (b.userId?._id || b.userId) === myId);
  const myNet = myBalance?.net || 0;
  const totalThisMonth = monthData?.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const myOwed = Math.abs(Math.min(myNet, 0));
  const iOwed = Math.max(myNet, 0);

  const todayExpenses = todayData?.expenses || [];
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const todayCategoryMap = {};
  for (const exp of todayExpenses) {
    todayCategoryMap[exp.category] = (todayCategoryMap[exp.category] || 0) + exp.amount;
  }
  const todayCategoryData = Object.entries(todayCategoryMap).map(([key, val]) => ({
    name: CATEGORY_MAP[key]?.label || key,
    emoji: CATEGORY_MAP[key]?.emoji || '📦',
    value: val,
  }));

  // Payment status: from recent expenses, for each member show settled/pending count
  const recentExpenses = recentData?.expenses || [];
  const members = household?.members?.map((m) => m.userId).filter(Boolean) || [];

  const memberPayStatus = members.map((m) => {
    const mId = m._id || m;
    let paid = 0, pending = 0;
    for (const exp of recentExpenses) {
      const split = exp.splits?.find((s) => (s.userId?._id || s.userId) === mId);
      if (split) {
        const paidByThisMember = (exp.paidBy?._id || exp.paidBy) === mId;
        if (paidByThisMember || split.settled) paid++;
        else pending++;
      }
    }
    return { member: m, paid, pending, total: paid + pending };
  }).filter((s) => s.total > 0);

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* Greeting */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted" style={{ fontSize: 'var(--text-label-md)', marginTop: 2 }}>
            {household?.name || 'Set up your household'}
          </p>
        </div>
      </div>

      {/* ── DESKTOP: 3 stat cards ── */}
      <div className="stats-grid desktop-only">
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatCurrency(totalThisMonth, currency)}</div>
        </div>
        <div className={`stat-card ${myOwed > 0 ? 'negative' : ''}`}>
          <div className="stat-label">You Owe</div>
          <div className="stat-value">{formatCurrency(myOwed, currency)}</div>
        </div>
        <div className={`stat-card ${iOwed > 0 ? 'positive' : ''}`}>
          <div className="stat-label">You're Owed</div>
          <div className="stat-value">{formatCurrency(iOwed, currency)}</div>
        </div>
      </div>

      {/* ── MOBILE: compact 2-col Today + Calendar row, then custom stats ── */}
      <div className="mobile-only">
        {/* Row 1: compact today donut + mini calendar side by side */}
        <div className="mobile-today-row">
          {/* Today's spending (compact) */}
          <div className="card mobile-today-card">
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-outline)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today
            </div>
            <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.25rem', color: todayTotal > 0 ? 'var(--color-on-surface)' : 'var(--color-outline)', marginBottom: 6 }}>
              {formatCurrency(todayTotal, currency)}
            </div>
            {todayTotal > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={90}>
                  <PieChart>
                    <Pie data={todayCategoryData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" paddingAngle={3}>
                      {todayCategoryData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                  {todayCategoryData.slice(0, 2).map((cat, idx) => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: CHART_COLORS[idx], flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.emoji} {cat.name}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-headline)' }}>
                        {formatCurrency(cat.value, currency, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 80, color: 'var(--color-outline)', fontSize: 12 }}>
                <span style={{ fontSize: 28 }}>✨</span>
                No expenses today
              </div>
            )}
          </div>

          {/* This month mini calendar (compact) */}
          <div className="card mobile-today-card" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-outline)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              This Month
            </div>
            <div className="mobile-cal-wrapper">
              <MiniCalendar expenses={monthData?.expenses || []} currency={currency} compact />
            </div>
          </div>
        </div>

        {/* Row 2: This Month + You Owe / You're Owed (custom layout) */}
        <div className="mobile-stats-row">
          {/* Left: This Month total */}
          <div className="card mobile-stat-main">
            <div className="stat-label">This Month</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              {formatCurrency(totalThisMonth, currency)}
            </div>
          </div>

          {/* Right: You Owe + You're Owed stacked */}
          <div className="mobile-stat-stack">
            <div className={`card mobile-stat-small ${myOwed > 0 ? 'negative' : ''}`}>
              <div className="stat-label" style={{ fontSize: 11 }}>You Owe</div>
              <div className="stat-value" style={{ fontSize: '1rem' }}>
                {formatCurrency(myOwed, currency)}
              </div>
            </div>
            <div className={`card mobile-stat-small ${iOwed > 0 ? 'positive' : ''}`}>
              <div className="stat-label" style={{ fontSize: 11 }}>You're Owed</div>
              <div className="stat-value" style={{ fontSize: '1rem' }}>
                {formatCurrency(iOwed, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: today donut + calendar ── */}
      <div className="dashboard-today-grid desktop-only">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Today's Spending</h2>
            <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1.25rem', color: todayTotal > 0 ? 'var(--color-on-surface)' : 'var(--color-outline)' }}>
              {formatCurrency(todayTotal, currency)}
            </span>
          </div>
          {todayTotal === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
              <div style={{ fontSize: 40 }}>✨</div>
              <p className="text-muted" style={{ fontSize: 'var(--text-label-md)' }}>No expenses today</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={todayCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {todayCategoryData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{ border: 'none', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {todayCategoryData.map((cat, idx) => (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-label-sm)', flex: 1 }}>{cat.emoji} {cat.name}</span>
                    <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 'var(--text-label-sm)' }}>
                      {formatCurrency(cat.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="card">
          <h2 className="section-title">This Month</h2>
          <MiniCalendar expenses={monthData?.expenses || []} currency={currency} />
        </div>
      </div>

      {/* ── Member Payment Status ── */}
      {memberPayStatus.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Payment Status</h2>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)' }}>
              from recent expenses
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 4 }}>
            {memberPayStatus.map(({ member, paid, pending, total }) => {
              const allPaid = pending === 0;
              return (
                <div
                  key={member._id || member}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', minWidth: 64 }}
                >
                  <div style={{ position: 'relative' }}>
                    <MemberAvatar user={member} size="md" />
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: allPaid ? 'var(--color-positive)' : 'var(--color-tertiary-fixed-dim)',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      color: 'white',
                      fontWeight: 700,
                    }}>
                      {allPaid ? '✓' : pending}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.name?.split(' ')[0]}
                  </div>
                  <span className={`badge ${allPaid ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                    {allPaid ? 'Paid' : `${pending} pending`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Member balance strip ── */}
      {household && balances && balances.filter((b) => (b.userId?._id || b.userId) !== myId).length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Member Balances</h2>
            <Link to="/balances" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 4 }}>
            {balances.filter((b) => (b.userId?._id || b.userId) !== myId).map((b) => {
              const net = b.net;
              return (
                <div
                  key={b.userId?._id || b.userId}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', minWidth: 72, cursor: 'pointer' }}
                  onClick={() => navigate(`/balances/${b.userId?._id || b.userId}`)}
                >
                  <MemberAvatar user={b.userId} size="md" />
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, textAlign: 'center' }}>
                    {b.userId?.name?.split(' ')[0]}
                  </div>
                  <span className={`badge ${net > 0 ? 'badge-positive' : net < 0 ? 'badge-negative' : 'badge-neutral'}`}>
                    {formatCurrency(Math.abs(net), currency, true)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent expenses ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Expenses</h2>
          <Link to="/expenses" className="btn btn-ghost btn-sm">See all</Link>
        </div>
        {expLoading ? (
          <LoadingSpinner />
        ) : recentExpenses.length === 0 ? (
          <EmptyState icon="📭" title="No expenses yet" description="Go to Expenses to add your first one" />
        ) : (
          <div>
            {recentExpenses.map((exp) => {
              const paidByMe = (exp.paidBy?._id || exp.paidBy) === myId;
              return (
                <div
                  key={exp._id}
                  className="expense-item"
                  onClick={() => navigate(`/expenses/${exp._id}`)}
                >
                  <CategoryBadge category={exp.category} />
                  <div className="expense-info">
                    <div className="expense-name">{exp.description}</div>
                    <div className="expense-meta">
                      {paidByMe ? 'You paid' : `${exp.paidBy?.name} paid`} · {formatDate(exp.date)}
                    </div>
                  </div>
                  <div className="expense-amount">{formatCurrency(exp.amount, currency)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
