import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useRole } from '@/hooks/useRole';

export default function AdminLogin() {
  const { signIn, isAuthenticated } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect once auth + role have both resolved and user is confirmed admin
  useEffect(() => {
    if (isAuthenticated && !roleLoading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, roleLoading, navigate]);

  /** @param {React.FormEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation is handled by the useEffect above once role is confirmed
    } catch (err) {
      setError((err instanceof Error ? err.message : null) || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ffffff] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-[#57534c] text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-[#57534c] text-3xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>&nbsp;GOLD</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#57534c]" />
            <p className="text-sm font-bold tracking-[0.3em] text-[#57534c]">ADMIN PORTAL</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e3e0da] bg-[#ffffff] p-8">
          <h2 className="mb-6 text-2xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold tracking-widest text-[#57534c]">EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ibvgold.co.za"
                className="w-full rounded-xl border border-[#e3e0da] bg-[#f7f5f0] px-4 py-3 text-base text-[#26231f] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#a47c2e]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold tracking-widest text-[#57534c]">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#e3e0da] bg-[#f7f5f0] px-4 py-3 pr-12 text-base text-[#26231f] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#a47c2e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534c] hover:text-[#57534c]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-700">{error}</p>
            )}
            {isAuthenticated && !roleLoading && !isAdmin && <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-base text-amber-700">This account does not have administrator access. Sign in with an admin account.</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
