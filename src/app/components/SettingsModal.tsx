import React, { useState } from "react";
import { X, Key, Eye, EyeOff, Info } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white" style={{ fontSize: "1.125rem", fontWeight: 600 }}>Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <Info className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-violet-300" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
              Add your <strong>OpenRouter API key</strong> to use real AI translation (GLM-4V / Qwen2-VL).
              Without it, the app uses mock translations for demo purposes.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-300 mb-1.5" style={{ fontSize: "0.875rem" }}>
              <Key className="w-4 h-4 text-violet-400" />
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors pr-10"
                style={{ fontSize: "0.875rem", fontFamily: "monospace" }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-600 mt-1" style={{ fontSize: "0.6875rem" }}>
              Get your key at openrouter.ai · Stored in localStorage only
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-400/80" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
              <strong>Dev note:</strong> This is a frontend-only MVP. API keys are stored in browser localStorage.
              For production, move the API call to a server-side proxy.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg py-2.5 transition-colors"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg py-2.5 transition-all"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
