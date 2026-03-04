import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus, BookOpen, Trash2, ChevronRight, LogOut,
  FileImage, Clock, Settings, X, Upload, Wand2,
  BarChart3, Layers
} from "lucide-react";
import { useAppStore } from "../store";
import { Page } from "../types";
import { SettingsModal } from "./SettingsModal";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, projects, logout, createProject, deleteProject, addPage } = useAppStore();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const p = createProject(newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setShowNew(false);
    navigate(`/project/${p.id}`);
  };

  const handleQuickUpload = (projectId: string) => {
    setUploadingFor(projectId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !uploadingFor) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const page: Page = {
          id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name.replace(/\.[^.]+$/, ""),
          imageDataUrl: ev.target?.result as string,
          textBlocks: [],
          aiTranslated: false,
        };
        addPage(uploadingFor, page);
      };
      reader.readAsDataURL(file);
    });
    setUploadingFor(null);
    e.target.value = "";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalPages = projects.reduce((s, p) => s + p.pages.length, 0);
  const totalBlocks = projects.reduce((s, p) => s + p.pages.reduce((s2, pg) => s2 + pg.textBlocks.length, 0), 0);
  const totalTranslated = projects.reduce((s, p) => s + p.pages.filter((pg) => pg.aiTranslated).length, 0);

  return (
    <div className="min-h-screen text-white" style={{ background: "#060610" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      {/* Navbar */}
      <header style={{ background: "rgba(13,13,28,0.9)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>
              Comic Trans Studio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", fontSize: "0.6875rem", fontWeight: 700 }}>
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              My Projects
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "2px" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""} · Upload manga pages and translate with AI
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              borderRadius: "10px",
              padding: "9px 16px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(124,58,237,0.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.25)"; }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Stats row */}
        {projects.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Layers, label: "Total Pages", value: totalPages, color: "#8b5cf6" },
              { icon: BarChart3, label: "Text Blocks", value: totalBlocks, color: "#6366f1" },
              { icon: Wand2, label: "AI Translated", value: totalTranslated, color: "#10b981" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="text-white" style={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <BookOpen className="w-9 h-9" style={{ color: "#334155" }} />
            </div>
            <h3 className="text-white mb-2" style={{ fontSize: "1.125rem", fontWeight: 600 }}>No projects yet</h3>
            <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "1.5rem", maxWidth: "320px" }}>
              Create your first project to start uploading manga pages and translating with AI.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: "10px", padding: "10px 20px", color: "white", fontSize: "0.875rem", fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const totalBlocksP = project.pages.reduce((s, p) => s + p.textBlocks.length, 0);
              const translatedPages = project.pages.filter((p) => p.aiTranslated).length;
              const progress = project.pages.length > 0 ? (translatedPages / project.pages.length) * 100 : 0;
              return (
                <div
                  key={project.id}
                  className="rounded-xl overflow-hidden cursor-pointer group transition-all"
                  style={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.07)" }}
                  onClick={() => navigate(`/project/${project.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid rgba(124,58,237,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Cover */}
                  <div className="relative h-36 overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a3c, #0a0a28)" }}>
                    {project.pages[0]?.imageDataUrl ? (
                      <img
                        src={project.pages[0].imageDataUrl}
                        alt={project.name}
                        className="w-full h-full object-cover transition-all"
                        style={{ opacity: 0.65 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-10 h-10" style={{ color: "#1e1b4b" }} />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #0d0d1e 100%)" }} />

                    {/* Page count badge */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", fontSize: "0.6875rem", color: "#94a3b8" }}>
                      {project.pages.length} pages
                    </div>

                    {/* Quick upload */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickUpload(project.id); }}
                      className="absolute top-2.5 left-2.5 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#7c3aed"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; }}
                      title="Add pages"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#94a3b8" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.8)"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.color = "#94a3b8"; }}
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-white truncate" style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="truncate mt-0.5" style={{ fontSize: "0.75rem", color: "#475569" }}>
                            {project.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" style={{ color: "#475569" }} />
                    </div>

                    {/* Progress bar */}
                    {project.pages.length > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span style={{ fontSize: "0.6875rem", color: "#475569" }}>Translation progress</span>
                          <span style={{ fontSize: "0.6875rem", color: progress === 100 ? "#10b981" : "#64748b" }}>
                            {translatedPages}/{project.pages.length}
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: progress === 100
                                ? "linear-gradient(90deg, #10b981, #059669)"
                                : "linear-gradient(90deg, #7c3aed, #6366f1)",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center gap-1" style={{ fontSize: "0.6875rem", color: "#475569" }}>
                        <FileImage className="w-3 h-3" />
                        {project.pages.length}p
                      </div>
                      <div className="flex items-center gap-1" style={{ fontSize: "0.6875rem", color: "#475569" }}>
                        <BarChart3 className="w-3 h-3" />
                        {totalBlocksP} blocks
                      </div>
                      <div className="flex items-center gap-1 ml-auto" style={{ fontSize: "0.6875rem", color: "#334155" }}>
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "#0e0e1e", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white" style={{ fontSize: "1.125rem", fontWeight: 600 }}>New Project</h2>
              <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#475569" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8", marginBottom: "6px" }}>Project name *</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. One Piece Vol. 108"
                  className="w-full outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "#f1f5f9", fontSize: "0.9375rem" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8", marginBottom: "6px" }}>Description (optional)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Chapter details, notes..."
                  className="w-full outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "#f1f5f9", fontSize: "0.9375rem" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 rounded-xl py-2.5 transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: "0.875rem" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 rounded-xl py-2.5 transition-all"
                style={{ background: newName.trim() ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(124,58,237,0.3)", color: "white", fontSize: "0.875rem", fontWeight: 600, cursor: newName.trim() ? "pointer" : "not-allowed" }}>
                Create & Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "#0e0e1e", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.12)" }}>
              <Trash2 className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <h2 className="text-white mb-2" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>Delete project?</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              This will permanently delete the project and all its pages and translations. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl py-2.5 transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: "0.875rem" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}>
                Cancel
              </button>
              <button onClick={() => { deleteProject(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 rounded-xl py-2.5 transition-all" style={{ background: "#dc2626", color: "white", fontSize: "0.875rem", fontWeight: 600 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#dc2626"; }}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
