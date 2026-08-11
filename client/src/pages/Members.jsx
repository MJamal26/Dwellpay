import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { formatCurrency } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Members() {
  const { user, household, setHousehold } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const currency = household?.currency || 'INR';

  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Always fetch a fresh household on mount so new members are visible
  useEffect(() => {
    if (!household?._id) return;
    api.get(`/households/${household._id}`)
      .then(({ data }) => setHousehold(data))
      .catch(() => {}); // silently ignore; stale data still shows
  }, []);

  const members = household?.members || [];
  const isOwner = members.find(
    (m) => (m.userId?._id || m.userId) === user?._id
  )?.role === 'owner';

  const copyInviteCode = () => {
    navigator.clipboard.writeText(household?.inviteCode || '');
    setCopied(true);
    addToast('Invite code copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      await api.delete(`/households/members/${confirmRemove}`);
      addToast('Member removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['household'] });
      // Refresh household from auth
      const { data } = await api.get(`/households/${household._id}`);
      setHousehold(data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    } finally {
      setRemoving(false);
      setConfirmRemove(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Members</h1>
      </div>

      {/* Members grid */}
      <div className="members-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {members.map((m) => {
          const mUser = m.userId;
          const mId = mUser?._id || mUser;
          const isMe = mId === user?._id;

          return (
            <div key={mId} className="member-card">
              <MemberAvatar user={mUser} size="lg" />
              <div style={{ fontWeight: 700, fontSize: 'var(--text-body-md)' }}>
                {mUser?.name || 'Member'}
                {isMe && (
                  <span style={{ color: 'var(--color-outline)', fontWeight: 400, fontSize: 'var(--text-caption)', marginLeft: 4 }}>
                    (you)
                  </span>
                )}
              </div>
              <div
                className={`badge ${m.role === 'owner' ? 'badge-primary' : 'badge-neutral'}`}
              >
                {m.role === 'owner' ? '👑 Owner' : '👤 Member'}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)' }}>
                {mUser?.email}
              </div>
              {isOwner && !isMe && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmRemove(mId)}
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite section */}
      <div className="card">
        <h2 className="section-title">Invite Housemates</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-label-md)' }}>
          Share this code with your housemates to invite them to <strong>{household?.name}</strong>.
        </p>

        <div
          style={{
            background: 'var(--color-surface-container-low)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            textAlign: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            Invite Code
          </div>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--color-primary)' }}>
            {household?.inviteCode}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary flex-1" onClick={copyInviteCode}>
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <button
            className="btn btn-secondary flex-1"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${household?.inviteCode}`);
              addToast('Invite link copied!', 'success');
            }}
          >
            🔗 Copy Link
          </button>
        </div>
      </div>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove Member"
          message="Are you sure you want to remove this member from the household? Their data will remain but they won't be part of future expenses."
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onCancel={() => setConfirmRemove(null)}
          isLoading={removing}
        />
      )}
    </div>
  );
}
