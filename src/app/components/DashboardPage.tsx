import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus, BookOpen, Trash2, ChevronRight, LogOut,
  FileImage, Clock, Settings, X, Upload
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

  const handleOpenProject = (id: string) => {
    navigate(`/project/${id}`);
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
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Navbar */}
      <header className="bg-[#0f0f1c] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>Comic Trans Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shrink-0" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <span className="text-slate-300" style={{ fontSize: "0.875rem" }}>{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              My Projects
            </h1>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.875rem" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""} · Upload manga pages and translate with AI
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-violet-500/20"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <BookOpen className="w-9 h-9 text-slate-600" />
            </div>
            <h3 className="text-slate-300 mb-2" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
              No projects yet
            </h3>
            <p className="text-slate-600 mb-6 max-w-sm" style={{ fontSize: "0.875rem" }}>
              Create your first project to start uploading manga pages and translating with AI.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const totalBlocks = project.pages.reduce((s, p) => s + p.textBlocks.length, 0);
              const translatedPages = project.pages.filter((p) => p.aiTranslated).length;
              return (
                <div
                  key={project.id}
                  className="bg-[#12121e] border border-white/10 hover:border-violet-500/40 rounded-xl overflow-hidden transition-all group cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  {/* Cover */}
                  <div className="relative h-36 bg-gradient-to-br from-violet-900/30 to-indigo-900/30 overflow-hidden">
                    {project.pages[0]?.imageDataUrl ? (
                      <img
                        src={project.pages[0].imageDataUrl}
                        alt={project.name}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-10 h-10 text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121e] via-transparent to-transparent" />

                    {/* Quick upload */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickUpload(project.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/50 hover:bg-violet-600 rounded-lg text-white"
                      title="Add pages"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/50 hover:bg-red-600 rounded-lg text-white"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-white truncate" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-slate-500 truncate mt-0.5" style={{ fontSize: "0.75rem" }}>
                            {project.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors shrink-0 mt-0.5" />
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: "0.75rem" }}>
                        <FileImage className="w-3.5 h-3.5" />
                        {project.pages.length} page{project.pages.length !== 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: "0.75rem" }}>
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        {totalBlocks} blocks
                      </div>
                      {translatedPages > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-500/80" style={{ fontSize: "0.75rem" }}>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {translatedPages} translated
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-slate-600" style={{ fontSize: "0.6875rem" }}>
                      <Clock className="w-3 h-3" />
                      {formatDate(project.updatedAt)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white" style={{ fontSize: "1.125rem", fontWeight: 600 }}>New Project</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1.5" style={{ fontSize: "0.875rem" }}>Project name *</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. One Piece Vol. 108"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  style={{ fontSize: "0.9375rem" }}
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5" style={{ fontSize: "0.875rem" }}>Description (optional)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Chapter details, notes..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  style={{ fontSize: "0.9375rem" }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg py-2.5 transition-colors"
                style={{ fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Create & Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-white mb-2" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>Delete project?</h2>
            <p className="text-slate-400 mb-6" style={{ fontSize: "0.875rem" }}>
              This will permanently delete the project and all its pages and translations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg py-2.5 transition-colors"
                style={{ fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteProject(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 transition-colors"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
