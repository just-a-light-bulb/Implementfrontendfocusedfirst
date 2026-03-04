import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Upload, Wand2, Download, Plus, BookOpen,
  ChevronLeft, ChevronRight, Settings, FileImage, Loader2,
  CheckCircle, AlertCircle, X, LayoutGrid, RefreshCw
} from "lucide-react";
import { useAppStore } from "../store";
import { translatePage } from "../lib/openrouter";
import { Page } from "../types";
import { CanvasEditor } from "./CanvasEditor";
import { TranslationGrid } from "./TranslationGrid";
import { SettingsModal } from "./SettingsModal";
import { ExportModal } from "./ExportModal";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, addPage, updatePage, settings } = useAppStore();

  const project = getProject(id!);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [translatingPageId, setTranslatingPageId] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{ background: "#060610" }}>
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "#1e1b4b" }} />
          <p style={{ color: "#475569" }}>Project not found.</p>
          <button onClick={() => navigate("/dashboard")} style={{ color: "#8b5cf6", marginTop: "12px", fontSize: "0.875rem" }}>
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentPage = project.pages[currentPageIndex] ?? null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const startIndex = project.pages.length;
    files.forEach((file, fi) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const page: Page = {
          id: `page-${Date.now()}-${fi}-${Math.random().toString(36).slice(2)}`,
          name: file.name.replace(/\.[^.]+$/, ""),
          imageDataUrl: ev.target?.result as string,
          textBlocks: [],
          aiTranslated: false,
        };
        addPage(project.id, page);
        if (fi === 0) setCurrentPageIndex(startIndex);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleTranslatePage = async (page: Page) => {
    if (translatingPageId) return;
    setTranslatingPageId(page.id);
    setTranslateError(null);
    try {
      // Pass existing blocks so their positions are preserved during re-translation
      const existingBlocks = page.textBlocks;
      const count = existingBlocks.length > 0 ? existingBlocks.length : 4;
      const blocks = await translatePage(
        page.imageDataUrl,
        settings.openRouterApiKey,
        count,
        existingBlocks
      );
      useAppStore.getState().replaceTextBlocks(project.id, page.id, blocks);
      updatePage(project.id, page.id, { aiTranslated: true });
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslatingPageId(null);
    }
  };

  const handleTranslateAll = async () => {
    const untranslated = project.pages.filter((p) => !p.aiTranslated);
    for (const page of untranslated) {
      await handleTranslatePage(page);
    }
  };

  const untranslatedCount = project.pages.filter((p) => !p.aiTranslated).length;

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden" style={{ background: "#060610" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />

      {/* Top Navbar */}
      <header className="flex items-center px-4 gap-3 shrink-0 z-30" style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(255,255,255,0.07)", height: "52px" }}>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 transition-colors"
          style={{ color: "#64748b", fontSize: "0.8125rem" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <BookOpen className="w-3 h-3 text-white" />
          </div>
          <h1 className="text-white truncate" style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {project.name}
          </h1>
          {currentPage && (
            <span className="truncate hidden sm:block" style={{ fontSize: "0.8125rem", color: "#334155" }}>
              / {currentPage.name}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Translate All */}
        {untranslatedCount > 0 && (
          <button
            onClick={handleTranslateAll}
            disabled={!!translatingPageId}
            className="flex items-center gap-2 transition-all"
            style={{
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#a78bfa",
              fontSize: "0.8125rem",
              fontWeight: 500,
              opacity: translatingPageId ? 0.5 : 1,
              cursor: translatingPageId ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!translatingPageId) e.currentTarget.style.background = "rgba(124,58,237,0.22)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }}
          >
            {translatingPageId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Translate All ({untranslatedCount})
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", padding: "6px 12px", color: "#94a3b8", fontSize: "0.8125rem" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>

        <button
          onClick={() => setShowExport(true)}
          disabled={project.pages.length === 0}
          className="flex items-center gap-2 transition-all"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", padding: "6px 12px", color: "#34d399", fontSize: "0.8125rem", fontWeight: 500, opacity: project.pages.length === 0 ? 0.4 : 1 }}
          onMouseEnter={(e) => { if (project.pages.length > 0) e.currentTarget.style.background = "rgba(16,185,129,0.18)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.12)"; }}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "#475569" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; }}
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      {/* Error banner */}
      {translateError && (
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#f87171" }} />
          <span style={{ fontSize: "0.8125rem", color: "#fca5a5" }}>{translateError}</span>
          <button onClick={() => setTranslateError(null)} className="ml-auto" style={{ color: "#f87171" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Page Thumbnails Sidebar */}
        <aside
          className="flex flex-col shrink-0 overflow-hidden transition-all"
          style={{
            width: showSidebar ? "176px" : "0px",
            background: "#09091a",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Pages ({project.pages.length})
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-lg transition-colors"
              style={{ color: "#334155" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#a78bfa"; e.currentTarget.style.background = "rgba(124,58,237,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; e.currentTarget.style.background = "transparent"; }}
              title="Add pages"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
            {project.pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-2">
                <FileImage className="w-7 h-7 mb-2" style={{ color: "#1e1b4b" }} />
                <p style={{ fontSize: "0.6875rem", color: "#334155" }}>No pages yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginTop: "6px", fontSize: "0.6875rem", color: "#7c3aed" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#a78bfa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#7c3aed"; }}
                >
                  Upload images
                </button>
              </div>
            ) : (
              project.pages.map((page, idx) => (
                <div
                  key={page.id}
                  onClick={() => { setCurrentPageIndex(idx); setSelectedBlockId(null); }}
                  className="rounded-lg overflow-hidden cursor-pointer group transition-all relative"
                  style={{
                    border: idx === currentPageIndex
                      ? "1.5px solid rgba(124,58,237,0.6)"
                      : "1.5px solid rgba(255,255,255,0.06)",
                    boxShadow: idx === currentPageIndex ? "0 0 16px rgba(124,58,237,0.15)" : "none",
                  }}
                  onMouseEnter={(e) => { if (idx !== currentPageIndex) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={(e) => { if (idx !== currentPageIndex) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <div className="relative h-24" style={{ background: "#0d0d24" }}>
                    <img src={page.imageDataUrl} alt={page.name} className="w-full h-full object-cover" />
                    {/* Status badge */}
                    <div className="absolute top-1.5 right-1.5">
                      {translatingPageId === page.id ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.9)" }}>
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        </div>
                      ) : page.aiTranslated ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.9)" }}>
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      ) : null}
                    </div>
                    {/* Hover translate */}
                    {translatingPageId !== page.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTranslatePage(page); }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.65)" }}
                      >
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: page.aiTranslated ? "rgba(16,185,129,0.8)" : "rgba(124,58,237,0.9)", fontSize: "0.5625rem", fontWeight: 600 }}>
                          {page.aiTranslated ? <RefreshCw className="w-2.5 h-2.5" /> : <Wand2 className="w-2.5 h-2.5" />}
                          {page.aiTranslated ? "Re-translate" : "AI Translate"}
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="px-2 py-1.5" style={{ background: idx === currentPageIndex ? "rgba(124,58,237,0.08)" : "#09091a" }}>
                    <p className="truncate" style={{ fontSize: "0.6875rem", color: idx === currentPageIndex ? "#c4b5fd" : "#475569" }}>
                      {idx + 1}. {page.name}
                    </p>
                    <p style={{ fontSize: "0.5625rem", color: "#1e293b" }}>
                      {page.textBlocks.length} blocks
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Sidebar toggle tab */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute z-20 flex items-center justify-center rounded-r-lg transition-all"
          style={{
            left: showSidebar ? "176px" : "0px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "16px",
            height: "44px",
            background: "#101024",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "none",
            color: "#334155",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#8b5cf6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; }}
        >
          {showSidebar ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Center: Canvas Editor */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentPage ? (
            <CanvasEditor
              projectId={project.id}
              pageId={currentPage.id}
              imageUrl={currentPage.imageDataUrl}
              textBlocks={currentPage.textBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-5" style={{ background: "#04040e" }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Upload className="w-9 h-9" style={{ color: "#1e293b" }} />
              </div>
              <div>
                <p className="text-white" style={{ fontSize: "1rem", fontWeight: 600 }}>No pages uploaded</p>
                <p style={{ fontSize: "0.875rem", color: "#334155", marginTop: "4px" }}>Upload manga pages to start translating</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: "10px", padding: "10px 20px", color: "white", fontSize: "0.875rem", fontWeight: 600 }}
              >
                <Upload className="w-4 h-4" />
                Upload Pages
              </button>
            </div>
          )}

          {/* Page navigation */}
          {project.pages.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: "#09091a", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "#475569", opacity: currentPageIndex === 0 ? 0.3 : 1 }}
                onMouseEnter={(e) => { if (currentPageIndex > 0) e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                Page {currentPageIndex + 1} of {project.pages.length}
                {currentPage && (
                  <span style={{ color: "#1e293b", marginLeft: "8px" }}>· {currentPage.textBlocks.length} blocks</span>
                )}
              </span>
              <button
                onClick={() => setCurrentPageIndex(Math.min(project.pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === project.pages.length - 1}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "#475569", opacity: currentPageIndex === project.pages.length - 1 ? 0.3 : 1 }}
                onMouseEnter={(e) => { if (currentPageIndex < project.pages.length - 1) e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>

        {/* Right: Translation Grid */}
        <aside className="flex flex-col shrink-0 overflow-hidden" style={{ width: "380px", background: "#09091a", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Grid header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#cbd5e1" }}>Translation Grid</span>
            </div>
            <div className="flex items-center gap-2">
              {currentPage?.aiTranslated && (
                <span className="flex items-center gap-1" style={{ fontSize: "0.6875rem", color: "#10b981" }}>
                  <CheckCircle className="w-3 h-3" />
                  Translated
                </span>
              )}
              {currentPage && (
                <button
                  onClick={() => handleTranslatePage(currentPage)}
                  disabled={!!translatingPageId}
                  className="flex items-center gap-1.5 transition-all"
                  style={{
                    background: currentPage.aiTranslated ? "rgba(16,185,129,0.1)" : "rgba(124,58,237,0.15)",
                    border: currentPage.aiTranslated ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(124,58,237,0.3)",
                    borderRadius: "8px",
                    padding: "5px 10px",
                    color: currentPage.aiTranslated ? "#34d399" : "#a78bfa",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    opacity: translatingPageId ? 0.5 : 1,
                    cursor: translatingPageId ? "not-allowed" : "pointer",
                  }}
                >
                  {translatingPageId === currentPage.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : currentPage.aiTranslated ? (
                    <RefreshCw className="w-3 h-3" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  {translatingPageId === currentPage.id
                    ? "Translating..."
                    : currentPage.aiTranslated
                    ? "Re-translate"
                    : "AI Translate"}
                </button>
              )}
            </div>
          </div>

          {/* AI Translation loading */}
          {translatingPageId === currentPage?.id && (
            <div className="p-4 flex flex-col gap-3 shrink-0" style={{ background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
              <div className="flex items-center gap-2" style={{ fontSize: "0.8125rem", color: "#a78bfa" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is analyzing the page...
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full animate-pulse" style={{ width: "60%", background: "linear-gradient(90deg, #7c3aed, #6366f1)" }} />
              </div>
              <p className="text-center" style={{ fontSize: "0.6875rem", color: "#334155" }}>
                Detecting bubbles · Matching gender honorifics · Generating Thai
              </p>
            </div>
          )}

          {currentPage ? (
            <TranslationGrid
              projectId={project.id}
              pageId={currentPage.id}
              textBlocks={currentPage.textBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ fontSize: "0.8125rem", color: "#334155" }}>
              No page selected
            </div>
          )}
        </aside>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showExport && <ExportModal project={project} onClose={() => setShowExport(false)} />}
    </div>
  );
}
