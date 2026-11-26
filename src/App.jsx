import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AppLayout from './components/app/AppLayout';
import Dashboard from './pages/app/Dashboard';
import GoldVault from './pages/app/GoldVault';
import Transact from './pages/app/Transact';
import Explore from './pages/app/Explore';
import Rewards from './pages/app/Rewards';
import Notifications from './pages/app/Notifications';
import Help from './pages/app/Help';
import AppSettings from './pages/app/AppSettings';
import Registration from './pages/app/Registration';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminShell';
import AdminOverview from './pages/admin/AdminOverview';
import AdminProducts from './pages/admin/AdminProducts';
import AdminRedemptions from './pages/admin/AdminRedemptions';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminVerifications from './pages/admin/AdminVerifications';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/registration" element={<Registration />} />
        <Route element={<AppLayout />}>
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/vault" element={<GoldVault />} />
          <Route path="/app/transact" element={<Transact />} />
          <Route path="/app/explore" element={<Explore />} />
          <Route path="/app/rewards" element={<Rewards />} />
          <Route path="/app/notifications" element={<Notifications />} />
          <Route path="/app/help" element={<Help />} />
          <Route path="/app/settings" element={<AppSettings />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/redemptions" element={<AdminRedemptions />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
