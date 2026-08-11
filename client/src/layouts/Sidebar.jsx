import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { disconnectSocket } from '../hooks/useSocket';
import MemberAvatar from '../components/MemberAvatar';
import { useTheme } from '../hooks/useTheme';

export default function Sidebar() {
  const { user, household, logout } = useAuthStore();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const isOwner = household?.members?.find(
    (m) => (m.userId?._id || m.userId) === user?._id
  )?.role === 'owner';

  const NAV_ITEMS = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/expenses', icon: '📋', label: 'Expenses' },
    { to: '/balances', icon: '⚖️', label: 'Balances' },
    { to: '/members', icon: '👥', label: 'Members' },
    { to: '/reports', icon: '📊', label: 'Reports' },
    ...(isOwner ? [{ to: '/settings', icon: '⚙️', label: 'Settings' }] : []),
  ];

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏡</div>
        <span className="sidebar-logo-text">DwellPay</span>
      </div>

      {/* Household name */}
      {household && (
        <div style={{ padding: 'var(--space-3) var(--space-6)', borderBottom: '1px solid var(--color-surface-container)' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Household
          </div>
          <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-on-surface)', marginTop: 2 }}>
            {household.name}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user + live indicator */}
      <div className="sidebar-footer">
        {/* Top row: live indicator + theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <div className="live-indicator">
            <div className={`live-dot ${isConnected ? 'connected' : ''}`} />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'var(--color-surface-container-high)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-full)',
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'background var(--duration-fast), transform var(--duration-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-container-highest)'; e.currentTarget.style.transform = 'rotate(20deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-container-high)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* User info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            marginTop: 'var(--space-2)',
          }}
        >
          <MemberAvatar user={user} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: 'var(--text-label-md)', fontWeight: 600 }}>
              {user?.name}
            </div>
            <div className="truncate" style={{ fontSize: 'var(--text-caption)', color: 'var(--color-outline)' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-outline)', padding: 4 }}
          >
            →
          </button>
        </div>
      </div>
    </aside>
  );
}
