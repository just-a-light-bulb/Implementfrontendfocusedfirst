import React, { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Wand2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAppStore, loadDemoProject } from "../store";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState("translator@example.com");
  const [password, setPassword] = useState("password");
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
    <div className="min-h-screen flex" style={{ background: "#060610" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0e0828 0%, #060610 60%)" }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute bottom-10 right-0 w-56 h-56 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Comic Trans Studio
            </span>
          </div>

          <h2 className="text-white mb-4" style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            AI-powered manga<br />translation at scale
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#94a3b8", lineHeight: 1.6 }}>
            Upload manga pages, position text bubbles, translate with AI, and export with Thai honorifics perfectly matched to each speaker.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: "🎌", text: "Detects speech bubbles automatically" },
              { icon: "🤖", text: "Qwen2-VL AI with gender-aware honorifics" },
              { icon: "📦", text: "Export as ZIP, JSON or CSV" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span style={{ fontSize: "1.25rem" }}>{f.icon}</span>
                <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#334155" }}>© 2026 Comic Trans Studio · Frontend MVP</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontSize: "1rem", fontWeight: 700 }}>Comic Trans Studio</span>
          </div>

          <h1 className="text-white mb-1" style={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.75rem" }}>
            Sign in to continue translating
          </p>

          {error && (
            <div className="mb-4 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#f1f5f9",
                  fontSize: "0.9375rem",
                }}
                placeholder="you@example.com"
                onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#cbd5e1", marginBottom: "0.5rem" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full outline-none transition-all pr-10"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#f1f5f9",
                    fontSize: "0.9375rem",
                  }}
                  placeholder="••••••••"
                  onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#475569" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" style={{ accentColor: "#7c3aed" }} />
                <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Remember me</span>
              </label>
              <a href="#" style={{ fontSize: "0.8125rem", color: "#8b5cf6" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8b5cf6")}
              >Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                borderRadius: "10px",
                padding: "11px",
                color: "white",
                fontSize: "0.9375rem",
                fontWeight: 600,
                boxShadow: loading ? "none" : "0 4px 24px rgba(124,58,237,0.3)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div className="relative text-center">
              <span style={{ background: "#060610", padding: "0 12px", fontSize: "0.8125rem", color: "#475569" }}>or</span>
            </div>
          </div>

          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "11px",
              color: "#e2e8f0",
              fontSize: "0.9375rem",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#a78bfa" }} />
            Try Demo — no sign-up needed
          </button>

          <p className="text-center mt-6" style={{ fontSize: "0.75rem", color: "#334155" }}>
            This is a frontend-only demo · No data is sent to any server
          </p>
        </div>
      </div>
    </div>
  );
}
