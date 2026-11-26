import React, { useState } from "react";
import "./auth.css";
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
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-brand-panel">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-4">
            <span
              className="text-[#57534c] text-5xl font-semibold"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              IBV
            </span>
            <span
              className="text-[#26231f] text-4xl font-semibold tracking-widest"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              GOLD
            </span>
          </div>
          <p className="text-[#57534c] text-base font-semibold tracking-[0.35em]">
            PHYSICAL GOLD. DIGITAL ACCESS.
          </p>
          <p className="auth-brand-story">
            A world of gold.
            <br />
            One place to call yours.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <Link
            to="/"
            className="mb-8 flex items-center gap-1 text-base font-bold text-[#57534c] hover:opacity-80"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          <h1
            className="mb-2 text-4xl font-semibold text-[#26231f]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Sign In
          </h1>
          <p className="mb-8 text-base text-[#57534c]">
            Welcome back. Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[#26231f] uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#dedbd4] bg-white px-4 py-3 text-base text-[#26231f] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#a47c2e]"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[#26231f] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#dedbd4] bg-white px-4 py-3 pr-12 text-base text-[#26231f] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#a47c2e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534c] hover:text-[#57534c]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-base text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-base text-[#57534c]">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[#57534c] hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
