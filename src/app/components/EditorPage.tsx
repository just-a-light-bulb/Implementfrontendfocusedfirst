import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Upload, Wand2, Download, Plus, BookOpen,
  ChevronLeft, ChevronRight, Settings, FileImage, Loader2,
  CheckCircle, AlertCircle, X, LayoutGrid
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
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center text-white">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Project not found.</p>
          <button onClick={() => navigate("/dashboard")} className="mt-3 text-violet-400 hover:text-violet-300">
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
      const blocks = await translatePage(page.imageDataUrl, settings.openRouterApiKey, 4);
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
    <div className="h-screen bg-[#0a0a14] text-white flex flex-col overflow-hidden">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />

      {/* Top Navbar */}
      <header className="bg-[#0f0f1c] border-b border-white/10 h-14 flex items-center px-4 gap-3 shrink-0 z-30">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          style={{ fontSize: "0.8125rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-white truncate" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
            {project.name}
          </h1>
          {currentPage && (
            <span className="text-slate-500 truncate hidden sm:block" style={{ fontSize: "0.8125rem" }}>
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
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-lg transition-colors disabled:opacity-50"
            style={{ fontSize: "0.8125rem", fontWeight: 500 }}
          >
            {translatingPageId ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            Translate All ({untranslatedCount})
          </button>
        )}

        {/* Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors"
          style={{ fontSize: "0.8125rem" }}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Pages
        </button>

        {/* Export */}
        <button
          onClick={() => setShowExport(true)}
          disabled={project.pages.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg transition-colors disabled:opacity-40"
          style={{ fontSize: "0.8125rem" }}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      {/* Error banner */}
      {translateError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span style={{ fontSize: "0.8125rem" }}>{translateError}</span>
          <button onClick={() => setTranslateError(null)} className="ml-auto hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Page Thumbnails Sidebar */}
        {showSidebar && (
          <aside className="w-48 bg-[#0d0d1a] border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-slate-400" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pages ({project.pages.length})
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                title="Add pages"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
              {project.pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileImage className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-slate-600" style={{ fontSize: "0.75rem" }}>No pages yet</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-violet-400 hover:text-violet-300 transition-colors"
                    style={{ fontSize: "0.6875rem" }}
                  >
                    Upload images
                  </button>
                </div>
              ) : (
                project.pages.map((page, idx) => (
                  <div
                    key={page.id}
                    onClick={() => { setCurrentPageIndex(idx); setSelectedBlockId(null); }}
                    className={`rounded-lg overflow-hidden cursor-pointer border transition-all group relative ${
                      idx === currentPageIndex
                        ? "border-violet-500 shadow-md shadow-violet-500/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="relative h-28 bg-[#1a1a2e]">
                      <img
                        src={page.imageDataUrl}
                        alt={page.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Translation status */}
                      <div className="absolute top-1 right-1">
                        {translatingPageId === page.id ? (
                          <div className="w-5 h-5 rounded-full bg-violet-600/80 flex items-center justify-center">
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          </div>
                        ) : page.aiTranslated ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600/80 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : null}
                      </div>
                      {/* Translate button on hover */}
                      {!page.aiTranslated && translatingPageId !== page.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTranslatePage(page); }}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-center gap-1 bg-violet-600 px-2 py-1 rounded" style={{ fontSize: "0.625rem" }}>
                            <Wand2 className="w-3 h-3" />
                            AI Translate
                          </div>
                        </button>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-[#0d0d1a]">
                      <p className="text-slate-400 truncate" style={{ fontSize: "0.6875rem" }}>
                        {idx + 1}. {page.name}
                      </p>
                      <p className="text-slate-600" style={{ fontSize: "0.5625rem" }}>
                        {page.textBlocks.length} blocks
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Center: Canvas Editor */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle sidebar */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-[#1a1a2e] border-r border-t border-b border-white/10 flex items-center justify-center text-slate-600 hover:text-white transition-colors rounded-r-lg"
            style={{ marginLeft: showSidebar ? "192px" : "0", transition: "margin 0.2s" }}
          >
            {showSidebar ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

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
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 bg-[#050508]">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Upload className="w-9 h-9 text-slate-600" />
              </div>
              <div>
                <p className="text-slate-400" style={{ fontSize: "1rem", fontWeight: 600 }}>No pages uploaded</p>
                <p className="text-slate-600 mt-1" style={{ fontSize: "0.875rem" }}>
                  Upload your manga pages to start translating
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-lg transition-all"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                <Upload className="w-4 h-4" />
                Upload Pages
              </button>
            </div>
          )}

          {/* Page navigation */}
          {project.pages.length > 0 && (
            <div className="bg-[#0f0f1c] border-t border-white/10 px-4 py-2 flex items-center justify-between shrink-0">
              <button
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-400" style={{ fontSize: "0.8125rem" }}>
                Page {currentPageIndex + 1} of {project.pages.length}
                {currentPage && (
                  <span className="text-slate-600 ml-2">· {currentPage.textBlocks.length} blocks</span>
                )}
              </span>
              <button
                onClick={() => setCurrentPageIndex(Math.min(project.pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === project.pages.length - 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>

        {/* Right: Translation Grid */}
        <aside className="w-96 bg-[#0d0d1a] border-l border-white/10 flex flex-col shrink-0">
          <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-slate-300" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Translation Grid
              </span>
            </div>
            {currentPage && !currentPage.aiTranslated && (
              <button
                onClick={() => handleTranslatePage(currentPage)}
                disabled={!!translatingPageId}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-lg transition-colors disabled:opacity-50"
                style={{ fontSize: "0.75rem" }}
              >
                {translatingPageId === currentPage.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                {translatingPageId === currentPage.id ? "Translating..." : "Translate Page"}
              </button>
            )}
            {currentPage?.aiTranslated && (
              <span className="flex items-center gap-1 text-emerald-400" style={{ fontSize: "0.6875rem" }}>
                <CheckCircle className="w-3 h-3" />
                AI Translated
              </span>
            )}
          </div>

          {/* AI Translation loading state */}
          {translatingPageId === currentPage?.id && (
            <div className="p-4 flex flex-col items-center gap-3 bg-violet-600/5 border-b border-violet-500/20">
              <div className="flex items-center gap-2 text-violet-300" style={{ fontSize: "0.8125rem" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is analyzing the page...
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-slate-500 text-center" style={{ fontSize: "0.6875rem" }}>
                Detecting speech bubbles · Analyzing gender & context · Generating Thai with correct honorifics
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
            <div className="flex-1 flex items-center justify-center text-slate-600" style={{ fontSize: "0.8125rem" }}>
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