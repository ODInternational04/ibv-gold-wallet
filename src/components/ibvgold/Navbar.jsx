import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Buy Gold", href: "#buy-gold" },
  { label: "What We Offer", href: "#what-we-offer" },
  { label: "Partner With Us", href: "#partners" },
  { label: "About Us", href: "#about" },
  { label: "Explore", href: "#explore" },
  { label: "Live Audit", href: "#audit" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#dedbd4] bg-[#ffffff] backdrop-blur-md">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <img src="/ibv-gold-logo.png" alt="IBV Gold Logo" className="h-8 w-auto" />
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-base font-semibold text-[#57534c] transition-colors hover:text-[#57534c]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/login"
            className="rounded border border-[#dedbd4] px-6 py-2 text-base font-medium text-[#26231f] transition-colors hover:bg-[#ffffff]"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-[#2d2a26] px-6 py-2 text-base font-semibold text-white transition-colors hover:bg-[#454037]"
          >
            SIGN UP
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-[#26231f]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#ffffff] border-t border-[#dedbd4] px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-base font-semibold text-[#57534c] hover:text-[#57534c]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-4">
            <Link
              to="/login"
              className="flex-1 rounded border border-[#dedbd4] px-4 py-2.5 text-center text-base font-medium text-[#26231f]"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="flex-1 rounded-xl bg-[#2d2a26] px-4 py-2.5 text-center text-base font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              SIGN UP
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
