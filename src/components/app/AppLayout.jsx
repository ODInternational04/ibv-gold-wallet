import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Scale, ArrowLeftRight,
  Bell, HelpCircle, Settings, ChevronRight, ChevronLeft, User, ChevronDown, Menu, X, LogOut, ShieldAlert, Clock
} from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile";
import { useAuth } from "@/lib/AuthContext";
import { useVerification } from "@/hooks/useVerification";

const navItems = [
  { label: "DASHBOARD", icon: LayoutDashboard, path: "/app/dashboard" },
  { label: "REDEEM", icon: Scale, path: "/app/vault" },
  { label: "TRANSACT", icon: ArrowLeftRight, path: "/app/transact", hasArrow: true },
  { label: "NOTIFICATIONS", icon: Bell, path: "/app/notifications" },
  { label: "HELP", icon: HelpCircle, path: "/app/help" },
  { label: "SETTINGS", icon: Settings, path: "/app/settings" },
];

export default function AppLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const { isVerified, isPending, loading: verificationLoading } = useVerification();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, location.pathname]);

  return (
    <div className="flex min-h-screen bg-white text-[#162028] md:h-screen md:overflow-hidden">
      {isMobile && mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-[#162028]/22 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-[#d9d1c4] bg-[#fbfaf7] transition-transform duration-300 md:static md:z-auto md:max-w-none md:flex-shrink-0 ${
        isMobile
          ? mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
          : collapsed
            ? "md:w-0 md:overflow-hidden"
            : "md:w-52"
      }`}>
        <div className="px-5 py-5">
          <Link to="/" className="flex items-center gap-0.5">
            <span
              className="text-[#396978] font-light text-2xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >IBV</span>
            <span
              className="text-[#22303a]/70 font-light text-2xl tracking-widest"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >&nbsp;GOLD</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => {
                  if (isMobile) {
                    setMobileMenuOpen(false);
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold tracking-wide transition-colors ${
                  active
                    ? "bg-[#396978]/15 text-[#7fb7c9] border border-[#396978]/25"
                    : "text-[#61707a] hover:text-[#22303a] hover:bg-[#efe8dc] border border-transparent"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {item.hasArrow && !active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 mt-auto space-y-3">
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-xs font-bold text-[#61707a] hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <p className="text-[#8d979d] text-[10px]">IBV Gold 2026</p>
          <p className="text-[#8d979d] text-[10px]">IBV Gold v7.0.9 [4da52bec]</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        {/* Top bar */}
        <header className="flex flex-wrap items-center gap-3 border-b border-[#d9d1c4] bg-[#fbfaf7] px-4 py-3 md:px-6 md:flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen((open) => !open);
                return;
              }

              setCollapsed((value) => !value);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#396978]/20 bg-[#396978]/12 text-[#7fb7c9] transition-colors hover:bg-[#396978]/18"
          >
            {isMobile ? (
              mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />
            ) : collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:ml-auto sm:justify-end sm:gap-4">
            <span className="truncate text-xs font-medium text-[#7fb7c9]/75 sm:text-sm">
              Hi {user?.email?.split('@')[0] ?? 'there'}. Welcome back!
            </span>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex cursor-pointer items-center gap-2 rounded border border-[#d9d1c4] px-2.5 py-1.5 hover:border-[#c2b6a0] sm:px-3"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8e0d5]">
                  <User className="w-3.5 h-3.5 text-[#55626c]" />
                </div>
                <span className="max-w-24 truncate text-sm text-[#22303a] sm:max-w-none">
                  {user?.email?.split('@')[0] ?? 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7a848a]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#d9d1c4] bg-white py-1 shadow-lg z-50">
                  <div className="border-b border-[#d9d1c4] px-4 py-2">
                    <p className="truncate text-xs text-[#8d979d]">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Verification banner */}
        {!verificationLoading && !isVerified && (
          isPending ? (
            <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 md:px-6">
              <Clock className="w-4 h-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                <span className="font-bold">Verification under review.</span> We'll notify you once your documents are approved.
              </p>
            </div>
          ) : (
            <Link
              to="/registration"
              className="flex items-center gap-3 border-b border-[#396978]/20 bg-[#396978]/10 px-4 py-2.5 transition-colors hover:bg-[#396978]/15 md:px-6"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#7fb7c9]" />
              <p className="flex-1 text-xs text-[#396978]">
                <span className="font-bold">Verify your profile to start transacting.</span> Upload your ID and utility bill to unlock buying.
              </p>
              <ChevronRight className="w-3.5 h-3.5 text-[#7fb7c9]/60" />
            </Link>
          )
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-[#f7f4ee] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
