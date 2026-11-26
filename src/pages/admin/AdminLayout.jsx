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
    <div className="flex min-h-screen bg-[#0f1217] text-white">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-white/8 bg-[#0a0c0e]">
        <div className="px-5 py-6 border-b border-white/8">
          <div className="flex items-center gap-1">
            <span className="text-[#396978] text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-white/50 text-xl font-light tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>&nbsp;GOLD</span>
          </div>
          <p className="mt-1 text-[10px] font-bold tracking-[0.25em] text-[#396978]/70">ADMIN PORTAL</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                  active
                    ? 'bg-[#396978]/20 text-[#7fb7c9]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/8 space-y-2">
          <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-xs font-bold text-white/30 hover:text-red-400 transition-colors"
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
