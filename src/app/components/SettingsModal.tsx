import React, { useState } from "react";
import { X, Key, Eye, EyeOff, Info, ShieldAlert } from "lucide-react";
import { useAppStore } from "../store";

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings } = useAppStore();
  const [apiKey, setApiKey] = useState(settings.openRouterApiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ openRouterApiKey: apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "#0e0e1e", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-white" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>Settings</h2>
            <p style={{ fontSize: "0.75rem", color: "#334155", marginTop: "1px" }}>Configure AI translation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info note */}
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#a78bfa" }} />
            <p style={{ fontSize: "0.75rem", color: "#a78bfa", lineHeight: 1.6 }}>
              Add your <strong>OpenRouter API key</strong> to enable real AI translation using Qwen2-VL.
              Without it, the app uses rich mock translations for demo purposes.
            </p>
          </div>

          {/* API Key input */}
          <div>
            <label className="flex items-center gap-2 mb-2" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8" }}>
              <Key className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "10px 40px 10px 14px",
                  color: "#f1f5f9",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#334155" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; }}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p style={{ fontSize: "0.6875rem", color: "#1e293b", marginTop: "6px" }}>
              Get your free key at{" "}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#7c3aed" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#a78bfa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#7c3aed"; }}
              >
                openrouter.ai
              </a>
              {" "}· Stored in browser localStorage only
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
            <p style={{ fontSize: "0.75rem", color: "#d97706", lineHeight: 1.5 }}>
              <strong>Note:</strong> This is a frontend-only MVP. API keys are stored in localStorage.
              For production, proxy API calls through a secure backend.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: "0.875rem" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl py-2.5 transition-all"
            style={{
              background: saved
                ? "linear-gradient(135deg, #059669, #047857)"
                : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: saved ? "0 4px 16px rgba(5,150,105,0.25)" : "0 4px 16px rgba(124,58,237,0.25)",
            }}
          >
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
