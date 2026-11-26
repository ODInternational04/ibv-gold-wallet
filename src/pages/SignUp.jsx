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
      <div className="flex min-h-screen items-center justify-center bg-[#ffffff] px-6">
        <div className="w-full max-w-md text-center">
          <h2 className="mb-4 text-3xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Check your email
          </h2>
          <p className="mb-6 text-base text-[#57534c]">
            We sent a confirmation link to <strong>{email}</strong>. Please check your inbox and confirm your email to continue.
          </p>
          <Link to="/login" className="text-base font-semibold text-[#57534c] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#ffffff]">
      {/* Left panel */}
      <div className="hidden w-1/2 items-center justify-center bg-white md:flex">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-4">
            <span className="text-[#57534c] text-5xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-[#26231f] text-4xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>GOLD</span>
          </div>
          <p className="text-[#57534c] text-base font-semibold tracking-[0.35em]">CREATE AN ACCOUNT</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center bg-[#ffffff] px-8 py-10 md:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-1 text-base font-bold text-[#57534c] hover:opacity-80">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="mb-2 text-4xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Create Account</h1>
          <p className="mb-8 text-base text-[#57534c]">Join IBV Gold and start your gold-backed financial journey.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[#26231f] uppercase tracking-wider">Email</label>
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
              <label className="block mb-1.5 text-sm font-semibold text-[#26231f] uppercase tracking-wider">Password</label>
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[#26231f] uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#dedbd4] bg-white px-4 py-3 text-base text-[#26231f] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#a47c2e]"
              />
            </div>

            {error && <p className="text-base text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-base text-[#57534c]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#57534c] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
