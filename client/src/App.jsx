import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Layouts
import AppLayout from './layouts/AppLayout';

// Auth & Onboarding
import Login from './pages/Login';
import Register from './pages/Register';
import CreateHousehold from './pages/CreateHousehold';
import InviteMembers from './pages/InviteMembers';
import OnboardingSuccess from './pages/OnboardingSuccess';
import JoinHousehold from './pages/JoinHousehold';
import JoinHouseholdSelect from './pages/JoinHouseholdSelect';

// Main App
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import Balances from './pages/Balances';
import BalanceDetails from './pages/BalanceDetails';
import Settlements from './pages/Settlements';
import Members from './pages/Members';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

// Route guard: redirect to login if not authenticated
// Also redirects to onboarding if logged in but has no household
function RequireAuth({ children }) {
  const { token, household } = useAuthStore();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // If no household, send to onboarding (unless already there)
  const isOnboarding = location.pathname.startsWith('/onboarding');
  if (!household && !isOnboarding) {
    return <Navigate to="/onboarding/join-household" replace />;
  }

  return children;
}

// Route guard: redirect away if already logged in
function RequireGuest({ children }) {
  const { token, household } = useAuthStore();
  if (!token) return children;
  // Logged in — send to onboarding if no household, else dashboard
  if (!household) return <Navigate to="/onboarding/join-household" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Route guard: only household owners can access Settings
function RequireOwner({ children }) {
  const { user, household } = useAuthStore();
  const isOwner = household?.members?.find(
    (m) => (m.userId?._id || m.userId) === user?._id
  )?.role === 'owner';

  if (!isOwner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-4)', textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 'var(--text-headline-lg)' }}>
          Owner Only
        </h1>
        <p style={{ color: 'var(--color-outline)', fontSize: 'var(--text-body-md)', maxWidth: 320 }}>
          Settings can only be accessed by the household owner. Contact your admin to make changes.
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
          <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
          <Route path="/join/:code" element={<JoinHousehold />} />

          {/* Onboarding (requires auth, no household yet) */}
          <Route path="/onboarding/join-household" element={<RequireAuth><JoinHouseholdSelect /></RequireAuth>} />
          <Route path="/onboarding/create-household" element={<RequireAuth><CreateHousehold /></RequireAuth>} />
          <Route path="/onboarding/invite" element={<RequireAuth><InviteMembers /></RequireAuth>} />
          <Route path="/onboarding/success" element={<RequireAuth><OnboardingSuccess /></RequireAuth>} />

          {/* Main app (requires auth) */}
          <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/add" element={
              <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
                <AddExpense />
              </div>
            } />
            <Route path="expenses/:id/edit" element={
              <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
                <AddExpense />
              </div>
            } />
            <Route path="balances" element={<Balances />} />
            <Route path="balances/:memberId" element={<BalanceDetails />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="members" element={<Members />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<RequireOwner><Settings /></RequireOwner>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
