import React, { useState } from "react";
import { Trash2, Check, X, MessageSquare, Languages } from "lucide-react";
import { TextBlock, SpeakerGender } from "../types";
import { useAppStore } from "../store";

interface Props {
  projectId: string;
  pageId: string;
  textBlocks: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

const GENDER_COLORS: Record<SpeakerGender, string> = {
  male: "#60a5fa",
  female: "#f472b6",
  unknown: "#a78bfa",
};

const GENDER_BG: Record<SpeakerGender, string> = {
  male: "rgba(96,165,250,0.12)",
  female: "rgba(244,114,182,0.12)",
  unknown: "rgba(167,139,250,0.12)",
};

export function TranslationGrid({ projectId, pageId, textBlocks, selectedBlockId, onSelectBlock }: Props) {
  const { updateTextBlock, deleteTextBlock } = useAppStore();
  const [editingCell, setEditingCell] = useState<{ blockId: string; field: "original" | "translated" } | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (blockId: string, field: "original" | "translated", value: string) => {
    setEditingCell({ blockId, field });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    updateTextBlock(projectId, pageId, editingCell.blockId, { [editingCell.field]: editValue });
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const handleGenderChange = (blockId: string, gender: SpeakerGender) => {
    updateTextBlock(projectId, pageId, blockId, { speakerGender: gender });
  };

  if (textBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Languages className="w-5 h-5" style={{ color: "#1e293b" }} />
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#334155", fontWeight: 500 }}>No text blocks yet</p>
        <p style={{ fontSize: "0.75rem", color: "#1e293b", marginTop: "4px", lineHeight: 1.5 }}>
          Click "AI Translate" to detect and translate bubbles, or add blocks manually on the canvas.
        </p>
      </div>
    );
  }

  const translatedCount = textBlocks.filter((b) => b.translated).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Progress header */}
      <div className="px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: "0.6875rem", color: "#334155" }}>Translation progress</span>
          <span style={{ fontSize: "0.6875rem", color: translatedCount === textBlocks.length ? "#10b981" : "#475569" }}>
            {translatedCount}/{textBlocks.length}
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: "2px", background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(translatedCount / textBlocks.length) * 100}%`,
              background: translatedCount === textBlocks.length
                ? "linear-gradient(90deg, #10b981, #059669)"
                : "linear-gradient(90deg, #7c3aed, #6366f1)",
            }}
          />
        </div>
      </div>

      {/* Column headers */}
      <div className="px-4 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="grid gap-2" style={{ gridTemplateColumns: "20px 1fr 1fr 76px 28px" }}>
          <div />
          <div className="flex items-center gap-1" style={{ fontSize: "0.625rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <MessageSquare className="w-3 h-3" /> Original
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: "0.625rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <Languages className="w-3 h-3" /> Thai
          </div>
          <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Speaker</div>
          <div />
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {textBlocks.map((block, i) => {
          const isSelected = block.id === selectedBlockId;
          const isEditingOriginal = editingCell?.blockId === block.id && editingCell.field === "original";
          const isEditingTranslated = editingCell?.blockId === block.id && editingCell.field === "translated";
          const gColor = GENDER_COLORS[block.speakerGender];

          return (
            <div
              key={block.id}
              onClick={() => onSelectBlock(isSelected ? null : block.id)}
              className="cursor-pointer group transition-all"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                borderLeft: isSelected ? `2px solid ${gColor}` : "2px solid transparent",
                background: isSelected ? `${GENDER_BG[block.speakerGender]}` : "transparent",
                padding: "8px 12px 8px 10px",
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
            >
              <div className="grid items-start gap-2" style={{ gridTemplateColumns: "20px 1fr 1fr 76px 28px" }}>
                {/* # */}
                <div
                  className="flex items-center justify-center rounded-md mt-0.5 shrink-0"
                  style={{
                    width: "20px",
                    height: "20px",
                    background: `${gColor}20`,
                    color: gColor,
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>

                {/* Original */}
                <div className="min-w-0">
                  {isEditingOriginal ? (
                    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter" && e.ctrlKey) commitEdit(); }}
                        className="w-full outline-none resize-none rounded-lg px-2.5 py-2"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(124,58,237,0.4)",
                          color: "#e2e8f0",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          minHeight: "54px",
                        }}
                        rows={3}
                      />
                      <div className="flex gap-1">
                        <button onClick={commitEdit} className="flex items-center gap-1 rounded-md transition-colors" style={{ padding: "2px 8px", background: "#059669", color: "white", fontSize: "0.625rem", fontWeight: 600 }}>
                          <Check className="w-2.5 h-2.5" /> Save
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 rounded-md transition-colors" style={{ padding: "2px 8px", background: "rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: "0.625rem" }}>
                          <X className="w-2.5 h-2.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onDoubleClick={(e) => { e.stopPropagation(); startEdit(block.id, "original", block.original); }}
                      title="Double-click to edit"
                      style={{
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        lineHeight: 1.5,
                        cursor: "text",
                        color: "#475569",
                        wordBreak: "break-all",
                      }}
                    >
                      {block.original || <span style={{ fontStyle: "italic", opacity: 0.4, fontSize: "0.6875rem" }}>empty</span>}
                    </p>
                  )}
                </div>

                {/* Translated */}
                <div className="min-w-0">
                  {isEditingTranslated ? (
                    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter" && e.ctrlKey) commitEdit(); }}
                        className="w-full outline-none resize-none rounded-lg px-2.5 py-2"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(124,58,237,0.4)",
                          color: "#f1f5f9",
                          fontSize: "0.75rem",
                          fontFamily: "'Sarabun', sans-serif",
                          minHeight: "54px",
                        }}
                        rows={3}
                      />
                      <div className="flex gap-1">
                        <button onClick={commitEdit} className="flex items-center gap-1 rounded-md" style={{ padding: "2px 8px", background: "#059669", color: "white", fontSize: "0.625rem", fontWeight: 600 }}>
                          <Check className="w-2.5 h-2.5" /> Save
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 rounded-md" style={{ padding: "2px 8px", background: "rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: "0.625rem" }}>
                          <X className="w-2.5 h-2.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onDoubleClick={(e) => { e.stopPropagation(); startEdit(block.id, "translated", block.translated); }}
                      title="Double-click to edit"
                      style={{
                        fontSize: "0.75rem",
                        fontFamily: "'Sarabun', sans-serif",
                        lineHeight: 1.5,
                        cursor: "text",
                        color: block.translated ? "#e2e8f0" : "#334155",
                        wordBreak: "break-word",
                        fontStyle: block.translated ? "normal" : "italic",
                      }}
                    >
                      {block.translated || <span style={{ opacity: 0.4, fontSize: "0.6875rem" }}>empty</span>}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={block.speakerGender}
                    onChange={(e) => handleGenderChange(block.id, e.target.value as SpeakerGender)}
                    className="w-full outline-none rounded-lg transition-colors"
                    style={{
                      background: `${gColor}15`,
                      border: `1px solid ${gColor}40`,
                      padding: "3px 6px",
                      fontSize: "0.625rem",
                      color: gColor,
                      fontWeight: 600,
                    }}
                  >
                    <option value="male">♂ Male</option>
                    <option value="female">♀ Female</option>
                    <option value="unknown">? Unknown</option>
                  </select>
                </div>

                {/* Delete */}
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      deleteTextBlock(projectId, pageId, block.id);
                      if (selectedBlockId === block.id) onSelectBlock(null);
                    }}
                    className="p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    style={{ color: "#334155" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#334155"; }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 shrink-0 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: "0.6875rem", color: "#1e293b" }}>
          {textBlocks.length} block{textBlocks.length !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: "0.6875rem", color: "#1e293b" }}>
          Double-click to edit · Click row to select on canvas
        </span>
      </div>
    </div>
  );
}
