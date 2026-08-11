import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', icon: '⊞', emoji: '🏠', label: 'Home' },
  { to: '/expenses',  icon: '≡',  emoji: '📋', label: 'Expenses' },
  { to: '/balances',  icon: '⚖',  emoji: '⚖️', label: 'Balances' },
  { to: '/members',   icon: '⁞⁞', emoji: '👥', label: 'Members' },
];

// SVG icons for clean, distinct silhouettes at small size
const ICONS = {
  '/dashboard': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ),
  '/expenses': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h4v1.5H8V10z"/>
    </svg>
  ),
  '/balances': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7H7C5.9 7 5 7.9 5 9v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 2v2H7V9h10zm-4 8H7v-4h6v4zm4 0h-2v-4h2v4zM12 1L8 5h8l-4-4z"/>
    </svg>
  ),
  '/members': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ),
};

export default function BottomTabBar({ onProfileOpen }) {
  const location = useLocation();
  const isProfileActive = false; // drawer, never "active route"

  return (
    <div className="ios-tab-bar">
      <div className="ios-tab-pill">
        {TABS.map((tab) => {
          const isActive = location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="ios-tab-item"
              aria-label={tab.label}
            >
              <span className={`ios-tab-icon-wrap ${isActive ? 'active' : ''}`}>
                {ICONS[tab.to]}
              </span>
            </NavLink>
          );
        })}

        {/* Profile — opens drawer */}
        <button
          className="ios-tab-item"
          onClick={onProfileOpen}
          aria-label="Profile"
        >
          <span className="ios-tab-icon-wrap">
            {ICONS.profile}
          </span>
        </button>
      </div>
    </div>
  );
}
