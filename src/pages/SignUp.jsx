import React, { useState } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function SignUp() {
  const { signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/app/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password);
      // If email confirmation is required, show success message; otherwise proceed
      if (data.user && !data.session) {
        setSuccess(true);
      } else {
        navigate("/registration");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] px-6">
        <div className="w-full max-w-md text-center">
          <h2 className="mb-4 text-3xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Check your email
          </h2>
          <p className="mb-6 text-sm text-[#66737c]">
            We sent a confirmation link to <strong>{email}</strong>. Please check your inbox and confirm your email to continue.
          </p>
          <Link to="/login" className="text-sm font-semibold text-[#396978] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f7f4ee]">
      {/* Left panel */}
      <div className="hidden w-1/2 items-center justify-center bg-[linear-gradient(145deg,_#161106_0%,_#0a0c0e_58%)] md:flex">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-4">
            <span className="text-[#396978] text-5xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-white/70 text-4xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>GOLD</span>
          </div>
          <p className="text-[#7fb7c9]/70 text-sm font-semibold tracking-[0.35em]">CREATE AN ACCOUNT</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center bg-[#f7f4ee] px-8 py-10 md:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-1 text-sm font-bold text-[#7fb7c9] hover:opacity-80">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="mb-2 text-4xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Create Account</h1>
          <p className="mb-8 text-sm text-[#66737c]">Join IBV Gold and start your gold-backed financial journey.</p>

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

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-[#22303a] uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#d1c6b7] bg-white px-4 py-3 text-sm text-[#22303a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#396978]/40"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#66737c]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#396978] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
