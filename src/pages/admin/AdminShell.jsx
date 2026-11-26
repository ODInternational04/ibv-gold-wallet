import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Users,
  LogOut,
  LayoutDashboard,
  Package,
  Landmark,
  Scale,
  Bell,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useWalletNotifications } from "@/hooks/useWalletNotifications";
import "./admin.css";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin", exact: true },
  { label: "Products & prices", icon: Package, path: "/admin/products" },
  { label: "Redemption values", icon: Scale, path: "/admin/redemptions" },
  { label: "Withdrawals", icon: Landmark, path: "/admin/withdrawals" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Notifications", icon: Bell, path: "/admin/notifications" },
  { label: "Identity approvals", icon: Users, path: "/admin/verifications" },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { unread } = useWalletNotifications("admin");
  return (
    <div className="admin-shell">
      {open && (
        <button
          className="admin-sidebar-shade"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <Link to="/admin" className="admin-brand">
          IBV <span>GOLD</span>
          <small>OPERATIONS PORTAL</small>
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={active ? "active" : ""}
              >
                <item.icon size={18} />
                {item.label}
                {item.path === "/admin/notifications" && unread > 0 && (
                  <b>{unread}</b>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/app/dashboard">
            <ExternalLink size={16} />
            Customer wallet
          </Link>
          <span>{user?.email}</span>
          <button onClick={() => logout()}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <button
            className="admin-mobile-toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
          <span className="admin-topbar-label">
            Your gold business, at a glance.
          </span>
          <div className="admin-topbar-right">
            <span className="admin-topbar-email">Admin workspace</span>
            <Link
              to="/admin/notifications"
              className="admin-bell"
              aria-label={`${unread} unread notifications`}
            >
              <Bell size={19} />
              {unread > 0 && <b>{unread}</b>}
            </Link>
          </div>
        </div>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
