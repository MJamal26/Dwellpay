import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../hooks/useSocket';
import MemberAvatar from '../components/MemberAvatar';
import { useTheme } from '../hooks/useTheme';

export default function MobileProfileDrawer({ isOpen, onClose }) {
  const { user, household, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const isOwner = household?.members?.find(
    (m) => (m.userId?._id || m.userId) === user?._id
  )?.role === 'owner';

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
    onClose();
  };

  const goTo = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity var(--duration-normal) var(--ease-out)',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(320px, 85vw)',
          background: 'var(--color-surface-container-lowest)',
          zIndex: 201,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--duration-normal) var(--ease-out)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 32px rgba(53,37,205,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-primary))',
          padding: 'var(--space-8) var(--space-6) var(--space-6)',
          paddingTop: 'calc(var(--space-8) + env(safe-area-inset-top, 0px))',
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 'calc(var(--space-4) + env(safe-area-inset-top, 0px))',
              right: 'var(--space-4)',
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 'var(--radius-full)',
              width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>

          <MemberAvatar user={user} size="xl" />
          <div style={{ marginTop: 'var(--space-3)', color: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'var(--text-headline-md)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 'var(--text-label-md)', opacity: 0.8, marginTop: 2 }}>
              {user?.email}
            </div>
            {household && (
              <div style={{
                marginTop: 'var(--space-3)',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', fontSize: 'var(--text-caption)', fontWeight: 600,
              }}>
                🏡 {household.name}
              </div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto' }}>
          <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-caption)', color: 'var(--color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 var(--space-2)' }}>
            Navigation
          </div>

          {[
            { icon: '📊', label: 'Reports', path: '/reports' },
            ...(isOwner ? [{ icon: '⚙️', label: 'Settings', path: '/settings' }] : []),
            { icon: '👥', label: 'Members', path: '/members' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                width: '100%', padding: 'var(--space-4)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-body-md)', fontWeight: 600,
                color: 'var(--color-on-surface)',
                textAlign: 'left',
                transition: 'background var(--duration-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-low)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer: theme toggle + logout */}
        <div style={{
          padding: 'var(--space-4)',
          paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--color-surface-container)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}>
          {/* Theme toggle row */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-body-md)', fontWeight: 600,
              color: 'var(--color-on-surface)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</span>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
            {/* Toggle pill — ON (right/primary) = dark mode active */}
            <span style={{
              width: 44,
              height: 24,
              borderRadius: 'var(--radius-full)',
              background: isDark ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
              position: 'relative',
              transition: 'background var(--duration-normal)',
              flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute',
                top: 3,
                left: isDark ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left var(--duration-normal)',
              }} />
            </span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              width: '100%', padding: 'var(--space-4)',
              background: 'var(--color-error-container)', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-body-md)', fontWeight: 700,
              color: 'var(--color-error)',
            }}
          >
            <span style={{ fontSize: 20 }}>🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
