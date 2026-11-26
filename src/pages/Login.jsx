import React, { useState } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/app/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f4ee]">
      {/* Left panel */}
      <div className="hidden w-1/2 items-center justify-center bg-[linear-gradient(145deg,_#161106_0%,_#0a0c0e_58%)] md:flex">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-4">
            <span className="text-[#396978] text-5xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-white/70 text-4xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>GOLD</span>
          </div>
          <p className="text-[#7fb7c9]/70 text-sm font-semibold tracking-[0.35em]">WELCOME BACK</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center bg-[#f7f4ee] px-8 py-10 md:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-1 text-sm font-bold text-[#7fb7c9] hover:opacity-80">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="mb-2 text-4xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Sign In</h1>
          <p className="mb-8 text-sm text-[#66737c]">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-[#22303a] uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#d1c6b7] bg-white px-4 py-3 text-sm text-[#22303a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#396978]/40"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-[#22303a] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#d1c6b7] bg-white px-4 py-3 pr-12 text-sm text-[#22303a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#396978]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa3a8] hover:text-[#396978]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#66737c]">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-[#396978] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
