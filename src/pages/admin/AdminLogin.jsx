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
    <div className="flex min-h-screen items-center justify-center bg-[#0a0c0e] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-[#396978] text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-white/50 text-3xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>&nbsp;GOLD</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#396978]/70" />
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#396978]/70">ADMIN PORTAL</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#141820] p-8">
          <h2 className="mb-6 text-2xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-white/30">EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ibvgold.co.za"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#396978]/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-white/30">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#396978]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs text-red-400">{error}</p>
            )}
            {isAuthenticated && !roleLoading && !isAdmin && <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">This account does not have administrator access. Sign in with an admin account.</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
