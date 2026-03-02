import React, { useState } from "react";
import { Trash2, Check, X, User } from "lucide-react";
import { TextBlock, SpeakerGender } from "../types";
import { useAppStore } from "../store";

interface Props {
  projectId: string;
  pageId: string;
  textBlocks: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

const GENDER_LABELS: Record<SpeakerGender, string> = {
  male: "♂ Male",
  female: "♀ Female",
  unknown: "? Unknown",
};

const GENDER_COLORS: Record<SpeakerGender, string> = {
  male: "#60a5fa",
  female: "#f472b6",
  unknown: "#a78bfa",
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
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <User className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-slate-500" style={{ fontSize: "0.8125rem" }}>
          No text blocks yet.
        </p>
        <p className="text-slate-600 mt-1" style={{ fontSize: "0.75rem" }}>
          Use "Translate with AI" or add blocks manually on the canvas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 shrink-0">
        <div className="grid text-slate-500" style={{
          gridTemplateColumns: "24px 1fr 1fr 80px 36px",
          gap: "4px",
          fontSize: "0.6875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "0 4px",
        }}>
          <div>#</div>
          <div>Original</div>
          <div>Thai Translation</div>
          <div>Speaker</div>
          <div />
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {textBlocks.map((block, i) => {
          const isSelected = block.id === selectedBlockId;
          const isEditingOriginal = editingCell?.blockId === block.id && editingCell.field === "original";
          const isEditingTranslated = editingCell?.blockId === block.id && editingCell.field === "translated";

          return (
            <div
              key={block.id}
              onClick={() => onSelectBlock(isSelected ? null : block.id)}
              className={`border-b border-white/5 transition-colors cursor-pointer group ${
                isSelected
                  ? "bg-violet-600/10 border-l-2 border-l-violet-500"
                  : "hover:bg-white/5"
              }`}
              style={{ padding: "6px 8px" }}
            >
              <div
                className="grid items-start"
                style={{ gridTemplateColumns: "24px 1fr 1fr 80px 36px", gap: "4px" }}
              >
                {/* # */}
                <div
                  className="flex items-center justify-center w-5 h-5 rounded mt-0.5 shrink-0"
                  style={{
                    background: GENDER_COLORS[block.speakerGender] + "20",
                    color: GENDER_COLORS[block.speakerGender],
                    fontSize: "0.625rem",
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
                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white outline-none focus:border-violet-500 resize-none"
                        style={{ fontSize: "0.75rem", fontFamily: "monospace", minHeight: "56px" }}
                        rows={3}
                      />
                      <div className="flex gap-1">
                        <button onClick={commitEdit} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded" style={{ fontSize: "0.625rem" }}>
                          <Check className="w-2.5 h-2.5" /> Save
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded" style={{ fontSize: "0.625rem" }}>
                          <X className="w-2.5 h-2.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onDoubleClick={(e) => { e.stopPropagation(); startEdit(block.id, "original", block.original); }}
                      title="Double-click to edit"
                      className="text-slate-400 break-words"
                      style={{ fontSize: "0.75rem", fontFamily: "monospace", lineHeight: 1.5, cursor: "text" }}
                    >
                      {block.original || <span className="italic opacity-40">empty</span>}
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
                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white outline-none focus:border-violet-500 resize-none"
                        style={{ fontSize: "0.75rem", fontFamily: "'Sarabun', sans-serif", minHeight: "56px" }}
                        rows={3}
                      />
                      <div className="flex gap-1">
                        <button onClick={commitEdit} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded" style={{ fontSize: "0.625rem" }}>
                          <Check className="w-2.5 h-2.5" /> Save
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded" style={{ fontSize: "0.625rem" }}>
                          <X className="w-2.5 h-2.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onDoubleClick={(e) => { e.stopPropagation(); startEdit(block.id, "translated", block.translated); }}
                      title="Double-click to edit"
                      className="text-white break-words"
                      style={{ fontSize: "0.75rem", fontFamily: "'Sarabun', sans-serif", lineHeight: 1.5, cursor: "text" }}
                    >
                      {block.translated || <span className="italic opacity-40 text-slate-500">empty</span>}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={block.speakerGender}
                    onChange={(e) => handleGenderChange(block.id, e.target.value as SpeakerGender)}
                    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 outline-none focus:border-violet-500 transition-colors"
                    style={{
                      fontSize: "0.625rem",
                      color: GENDER_COLORS[block.speakerGender],
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
                    onClick={() => { deleteTextBlock(projectId, pageId, block.id); if (selectedBlockId === block.id) onSelectBlock(null); }}
                    className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
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
      <div className="px-3 py-2 border-t border-white/10 shrink-0 flex items-center justify-between">
        <span className="text-slate-600" style={{ fontSize: "0.6875rem" }}>
          {textBlocks.length} block{textBlocks.length !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-600" style={{ fontSize: "0.6875rem" }}>
          Double-click to edit · Click row to highlight on canvas
        </span>
      </div>
    </div>
  );
}
