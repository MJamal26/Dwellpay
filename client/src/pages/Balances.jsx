import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Balances() {
  const { user, household } = useAuthStore();
  const navigate = useNavigate();
  const currency = household?.currency || 'INR';
  const myId = user?._id;

  const [activeTab, setActiveTab] = useState('owe'); // 'owe' | 'owed'

  const { data: balances, isLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/balances').then((r) => r.data),
    enabled: !!household,
  });

  const myBalance = balances?.find((b) => (b.userId?._id || b.userId) === myId);
  const myNet = myBalance?.net || 0;

  const others = balances?.filter((b) => (b.userId?._id || b.userId) !== myId) || [];

  // I Owe: net < 0 (they paid, I owe them)
  const iOwe = others.filter((b) => b.net < 0);
  // Owed to me: net > 0 (I paid, they owe me)
  const owedToMe = others.filter((b) => b.net > 0);

  const totalIOwe = iOwe.reduce((s, b) => s + Math.abs(b.net), 0);
  const totalOwedToMe = owedToMe.reduce((s, b) => s + b.net, 0);

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
            padding: 'var(--space-5)',
            textAlign: 'center',
            cursor: 'pointer',
            border: activeTab === 'owe' ? '2px solid var(--color-tertiary-fixed-dim)' : '2px solid transparent',
            transition: 'border var(--duration-fast)',
          }}
          onClick={() => setActiveTab('owe')}
        >
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
            You Owe
          </div>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-tertiary-fixed-dim)' }}>
            {formatCurrency(totalIOwe, currency)}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', marginTop: 'var(--space-1)' }}>
            to {iOwe.length} {iOwe.length === 1 ? 'person' : 'people'}
          </div>
        </div>

        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--color-positive-bg), var(--color-surface-container-lowest))',
            padding: 'var(--space-5)',
            textAlign: 'center',
            cursor: 'pointer',
            border: activeTab === 'owed' ? '2px solid var(--color-positive)' : '2px solid transparent',
            transition: 'border var(--duration-fast)',
          }}
          onClick={() => setActiveTab('owed')}
        >
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
            Owed to You
          </div>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-positive)' }}>
            {formatCurrency(totalOwedToMe, currency)}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', marginTop: 'var(--space-1)' }}>
            from {owedToMe.length} {owedToMe.length === 1 ? 'person' : 'people'}
          </div>
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
          description={activeTab === 'owe' ? 'You\'re all squared up with your housemates' : 'Add expenses with housemates to track balances'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {list.map((b) => {
            const memberId = b.userId?._id || b.userId;
            const net = b.net;
            const amount = Math.abs(net);

            return (
              <div
                key={memberId}
                className="balance-card"
                onClick={() => navigate(`/balances/${memberId}`)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {/* Coloured left accent bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: activeTab === 'owe' ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-positive)',
                  borderRadius: '4px 0 0 4px',
                }} />
                <div style={{ paddingLeft: 'var(--space-3)' }}>
                  <MemberAvatar user={b.userId} size="md" />
                </div>
                <div className="balance-info">
                  <div className="balance-name">{b.userId?.name || 'Member'}</div>
                  <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--color-outline)', marginTop: 2 }}>
                    {activeTab === 'owe' ? 'Tap to see details & pay' : 'Tap to view shared expenses'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    className="balance-amount"
                    style={{ color: activeTab === 'owe' ? 'var(--color-tertiary-fixed-dim)' : 'var(--color-positive)' }}
                  >
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

      {/* Net summary footer */}
      {!isLoading && others.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-outline)', fontWeight: 500 }}>
            Net position
          </span>
          <span style={{
            fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'var(--text-body-lg)',
            color: myNet >= 0 ? 'var(--color-positive)' : 'var(--color-tertiary-fixed-dim)',
          }}>
            {myNet >= 0 ? '+' : '-'}{formatCurrency(Math.abs(myNet), currency)}
          </span>
        </div>
      )}
    </div>
  );
}
