import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';
import ToastContainer from '../components/ToastContainer';
import { useSocket } from '../hooks/useSocket';
import { useAutoPushSubscription } from '../hooks/useAutoPushSubscription';
import MobileProfileDrawer from './MobileProfileDrawer';

export default function AppLayout() {
  // Initialize socket connection & auto push notification prompt for entire authenticated app
  useSocket();
  useAutoPushSubscription();

  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar onProfileOpen={() => setProfileDrawerOpen(true)} />

      {/* Mobile profile drawer */}
      <MobileProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />

      {/* Global toasts */}
      <ToastContainer />
    </div>
  );
}
