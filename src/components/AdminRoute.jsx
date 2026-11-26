import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useRole } from '@/hooks/useRole';

export default function AdminRoute() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();

  if (isLoadingAuth || roleLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0c0e]">
        <div className="w-8 h-8 border-4 border-[#396978]/30 border-t-[#396978] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
