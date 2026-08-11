import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, CATEGORY_MAP, MONTHS } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#059669', '#0891b2', '#0284c7',
  '#84cc16', '#f97316', '#8b5cf6', '#64748b',
];

export default function Reports() {
  const { household } = useAuthStore();
  const currency = household?.currency || 'INR';
  const [year, setYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', year],
    queryFn: () => api.get(`/reports?year=${year}`).then((r) => r.data),
    enabled: !!household,
  });

  // Fill in all 12 months (0 for missing ones)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const found = data?.monthly?.find((m) => m._id === i + 1);
    return { month: MONTHS[i], total: found?.total || 0, count: found?.count || 0 };
  });

  const categoryData = (data?.byCategory || []).map((c) => ({
    name: CATEGORY_MAP[c._id]?.label || c._id,
    value: c.total,
    emoji: CATEGORY_MAP[c._id]?.emoji || '📦',
  }));

  const stats = data?.stats || {};

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-headline)', fontWeight: 700 }}>
            {formatCurrency(payload[0].value, currency)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>‹</button>
          <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, minWidth: 50, textAlign: 'center' }}>{year}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            style={{ opacity: year >= currentYear ? 0.3 : 1, cursor: year >= currentYear ? 'not-allowed' : 'pointer' }}
          >›</button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Stats row */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card">
              <div className="stat-label">Total Spent ({year})</div>
              <div className="stat-value">{formatCurrency(stats.totalSpent || 0, currency)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Expenses Logged</div>
              <div className="stat-value">{stats.totalExpenses || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Largest Expense</div>
              <div className="stat-value">{formatCurrency(stats.largestExpense || 0, currency)}</div>
            </div>
          </div>

          <div className="reports-grid">
            {/* Monthly bar chart */}
            <div className="card">
              <h2 className="section-title">Monthly Spending</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container-high)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-outline)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-outline)', fontSize: 11 }}
                    tickFormatter={(v) => `${currency === 'USD' ? '$' : '₹'}${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-primary-fixed)' }} />
                  <Bar dataKey="total" fill="var(--color-primary-container)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category donut */}
            <div className="card">
              <h2 className="section-title">By Category</h2>
              {categoryData.length === 0 ? (
                <div className="text-muted text-center" style={{ padding: 'var(--space-8)' }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val, currency)}
                      contentStyle={{ border: 'none', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Legend
                      formatter={(val) => (
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-on-surface)' }}>{val}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category breakdown list */}
          {categoryData.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--space-6)' }}>
              <h2 className="section-title">Category Breakdown</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {categoryData.map((cat, idx) => {
                  const pct = stats.totalSpent > 0 ? (cat.value / stats.totalSpent) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                        <span style={{ fontSize: 'var(--text-label-md)', fontWeight: 500 }}>
                          {cat.emoji} {cat.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 'var(--text-label-md)' }}>
                          {formatCurrency(cat.value, currency)}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--color-surface-container)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.8s var(--ease-out)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
