import React, { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Wand2, Eye, EyeOff } from "lucide-react";
import { useAppStore, loadDemoProject } from "../store";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState("translator@example.com");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 900));
    login({ id: "user-1", name: "Translator Pro", email });
    setLoading(false);
    navigate("/dashboard");
  };

  const handleDemo = async () => {
    setLoading(true);
    login({ id: "demo-user", name: "Demo User", email: "demo@example.com" });
    loadDemoProject();
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white" style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.2 }}>
            Comic Trans Studio
          </h1>
          <p className="text-slate-400 mt-1" style={{ fontSize: "0.875rem" }}>
            AI-powered manga translation platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#12121e] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white mb-1" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
            Sign in to your account
          </h2>
          <p className="text-slate-500 mb-6" style={{ fontSize: "0.8125rem" }}>
            Powered by Auth0 · Secured with JWT
          </p>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3" style={{ fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-1.5" style={{ fontSize: "0.875rem" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                style={{ fontSize: "0.9375rem" }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5" style={{ fontSize: "0.875rem" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors pr-10"
                  style={{ fontSize: "0.9375rem" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-white/5 text-violet-600" />
                <span className="text-slate-400" style={{ fontSize: "0.8125rem" }}>Remember me</span>
              </label>
              <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors" style={{ fontSize: "0.8125rem" }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg py-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
              style={{ fontSize: "0.9375rem", fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative text-center">
              <span className="bg-[#12121e] px-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>or</span>
            </div>
          </div>

          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-white rounded-lg py-2.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ fontSize: "0.9375rem", fontWeight: 500 }}
          >
            <Wand2 className="w-4 h-4 text-violet-400" />
            Try Demo — no signup needed
          </button>
        </div>

        <p className="text-center text-slate-600 mt-6" style={{ fontSize: "0.75rem" }}>
          © 2026 Comic Trans Studio · Frontend-Only MVP
        </p>
      </div>
    </div>
  );
}
