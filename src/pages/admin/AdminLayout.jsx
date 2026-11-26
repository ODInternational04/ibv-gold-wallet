import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'User Approvals', icon: Users, path: '/admin/verifications' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[#ffffff] text-[#26231f]">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-[#e3e0da] bg-[#ffffff]">
        <div className="px-5 py-6 border-b border-[#e3e0da]">
          <div className="flex items-center gap-1">
            <span className="text-[#57534c] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-[#57534c] text-xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>&nbsp;GOLD</span>
          </div>
          <p className="mt-1 text-sm font-bold tracking-[0.25em] text-[#57534c]">ADMIN PORTAL</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors ${
                  active
                    ? 'bg-[#ffffff] text-[#57534c]'
                    : 'text-[#57534c] hover:text-[#26231f] hover:bg-[#f7f5f0]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[#e3e0da] space-y-2">
          <p className="text-sm text-[#57534c] truncate">{user?.email}</p>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-sm font-bold text-[#57534c] hover:text-red-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
