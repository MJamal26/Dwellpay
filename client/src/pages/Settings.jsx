import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { disconnectSocket } from '../hooks/useSocket';
import MemberAvatar from '../components/MemberAvatar';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settings() {
  const { user, household, setAuth, logout, updateUser, setHousehold } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [householdForm, setHouseholdForm] = useState({ name: household?.name || '', currency: household?.currency || 'INR' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isOwner = household?.members?.find(
    (m) => (m.userId?._id || m.userId) === user?._id
  )?.role === 'owner';

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/settings/profile', profileForm);
      updateUser(data);
      addToast('Profile updated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveHousehold = async (e) => {
    e.preventDefault();
    setSavingHousehold(true);
    try {
      const { data } = await api.put('/households', householdForm);
      setHousehold(data);
      addToast('Household settings saved!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update household', 'error');
    } finally {
      setSavingHousehold(false);
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="section-title">Your Profile</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <MemberAvatar user={user} size="xl" />
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 'var(--text-headline-md)' }}>{user?.name}</div>
            <div className="text-muted">{user?.email}</div>
          </div>
        </div>

        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              className="form-input"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Currency</label>
            <select
              className="form-input"
              value={profileForm.currency}
              onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
            >
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Household settings (owner only) */}
      {household && isOwner && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="section-title">Household Settings</h2>
          <form onSubmit={saveHousehold} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Household Name</label>
              <input
                className="form-input"
                value={householdForm.name}
                onChange={(e) => setHouseholdForm({ ...householdForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Household Currency</label>
              <select
                className="form-input"
                value={householdForm.currency}
                onChange={(e) => setHouseholdForm({ ...householdForm, currency: e.target.value })}
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingHousehold} style={{ alignSelf: 'flex-start' }}>
              {savingHousehold ? 'Saving...' : 'Save Household'}
            </button>
          </form>
        </div>
      )}

      {/* Links */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="section-title">Quick Links</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[
            { label: '👥 Manage Members', to: '/members' },
            { label: '📊 View Reports', to: '/reports' },
            { label: '💸 View Settlements', to: '/settlements' },
          ].map((item) => (
            <button
              key={item.to}
              className="nav-item"
              onClick={() => navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: 'var(--color-error-container)' }}>
        <h2 className="section-title" style={{ color: 'var(--color-error)' }}>Account</h2>
        <button
          className="btn btn-danger"
          onClick={() => setConfirmLogout(true)}
        >
          → Sign Out
        </button>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="Sign Out"
          message="Are you sure you want to sign out of DwellPay?"
          confirmLabel="Sign Out"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}
