import React, { useRef, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { TextBlock } from "../types";
import { useAppStore } from "../store";

interface Props {
  projectId: string;
  pageId: string;
  imageUrl: string;
  textBlocks: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

const GENDER_COLORS: Record<string, string> = {
  male: "#60a5fa",
  female: "#f472b6",
  unknown: "#a78bfa",
};

export function CanvasEditor({
  projectId, pageId, imageUrl, textBlocks,
  selectedBlockId, onSelectBlock,
}: Props) {
  const { updateTextBlock, deleteTextBlock, addTextBlock } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{
    blockId: string;
    startMouseX: number;
    startMouseY: number;
    startBlockX: number;
    startBlockY: number;
  } | null>(null);

  const resizing = useRef<{
    blockId: string;
    startMouseX: number;
    startMouseY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [zoom, setZoom] = useState(1);

  // ── Drag start ──────────────────────────────
  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, block: TextBlock) => {
      e.preventDefault();
      e.stopPropagation();
      if (editingId === block.id) return;
      onSelectBlock(block.id);
      dragging.current = {
        blockId: block.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startBlockX: block.x,
        startBlockY: block.y,
      };
    },
    [editingId, onSelectBlock]
  );

  // ── Resize start ────────────────────────────
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, block: TextBlock) => {
      e.preventDefault();
      e.stopPropagation();
      resizing.current = {
        blockId: block.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startW: block.width,
        startH: block.height,
      };
    },
    []
  );

  // ── Mouse move ──────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (dragging.current) {
        const dx = ((e.clientX - dragging.current.startMouseX) / rect.width) * 100;
        const dy = ((e.clientY - dragging.current.startMouseY) / rect.height) * 100;
        const newX = Math.max(0, Math.min(95, dragging.current.startBlockX + dx));
        const newY = Math.max(0, Math.min(95, dragging.current.startBlockY + dy));
        updateTextBlock(projectId, pageId, dragging.current.blockId, { x: newX, y: newY });
      }

      if (resizing.current) {
        const dx = ((e.clientX - resizing.current.startMouseX) / rect.width) * 100;
        const dy = ((e.clientY - resizing.current.startMouseY) / rect.height) * 100;
        const newW = Math.max(8, Math.min(80, resizing.current.startW + dx));
        const newH = Math.max(5, Math.min(50, resizing.current.startH + dy));
        updateTextBlock(projectId, pageId, resizing.current.blockId, { width: newW, height: newH });
      }
    },
    [projectId, pageId, updateTextBlock]
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
    resizing.current = null;
  }, []);

  // ── Double click to edit ────────────────────
  const handleDoubleClick = useCallback((block: TextBlock) => {
    setEditingId(block.id);
    setEditValue(block.translated);
  }, []);

  const commitEdit = useCallback(() => {
    if (editingId) {
      updateTextBlock(projectId, pageId, editingId, { translated: editValue });
      setEditingId(null);
    }
  }, [editingId, editValue, projectId, pageId, updateTextBlock]);

  // ── Click on canvas background (deselect) ──
  const handleCanvasClick = useCallback(() => {
    onSelectBlock(null);
  }, [onSelectBlock]);

  // ── Add new text block ──────────────────────
  const handleAddBlock = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const block: TextBlock = {
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        original: "",
        translated: "ข้อความใหม่",
        x: Math.max(0, Math.min(80, x)),
        y: Math.max(0, Math.min(85, y)),
        width: 28,
        height: 11,
        fontSize: 13,
        color: "#000000",
        bgColor: "#ffffff",
        speakerGender: "unknown",
      };
      addTextBlock(projectId, pageId, block);
      onSelectBlock(block.id);
    },
    [projectId, pageId, addTextBlock, onSelectBlock]
  );

  const [addMode, setAddMode] = useState(false);

  const selected = textBlocks.find((b) => b.id === selectedBlockId);

  // Global mouse up
  useEffect(() => {
    const up = () => { dragging.current = null; resizing.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a14]">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f1c] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setAddMode(!addMode); onSelectBlock(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              addMode
                ? "bg-violet-600 text-white"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
            style={{ fontSize: "0.75rem", fontWeight: 500 }}
            title="Click on image to add a text block"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Block
          </button>

          {selected && (
            <button
              onClick={() => { deleteTextBlock(projectId, pageId, selected.id); onSelectBlock(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              style={{ fontSize: "0.75rem" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>

        {/* Selected block style controls */}
        {selected && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: "0.75rem" }}>
              Size:
            </div>
            <input
              type="range"
              min={9}
              max={24}
              value={selected.fontSize}
              onChange={(e) => updateTextBlock(projectId, pageId, selected.id, { fontSize: Number(e.target.value) })}
              className="w-20 accent-violet-500"
            />
            <span className="text-slate-400 w-6 text-right" style={{ fontSize: "0.75rem" }}>{selected.fontSize}</span>

            <div className="flex items-center gap-1 ml-2">
              <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>BG:</span>
              {["#ffffff", "#000000", "transparent"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateTextBlock(projectId, pageId, selected.id, { bgColor: color })}
                  className={`w-5 h-5 rounded border transition-all ${
                    selected.bgColor === color ? "border-violet-400 scale-110" : "border-white/20"
                  }`}
                  style={{
                    background: color === "transparent" ? "linear-gradient(135deg, #fff 45%, #f00 45%, #f00 55%, #fff 55%)" : color,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 ml-1">
              <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Text:</span>
              {["#000000", "#ffffff", "#dc2626"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateTextBlock(projectId, pageId, selected.id, { color })}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    selected.color === color ? "border-violet-400 scale-110" : "border-white/20"
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 ml-1">
              <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Speaker:</span>
              {(["male", "female", "unknown"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => updateTextBlock(projectId, pageId, selected.id, { speakerGender: g })}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    selected.speakerGender === g
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  style={{
                    fontSize: "0.6875rem",
                    background: selected.speakerGender === g ? GENDER_COLORS[g] + "40" : "transparent",
                    borderColor: selected.speakerGender === g ? GENDER_COLORS[g] : "transparent",
                    border: "1px solid",
                  }}
                >
                  {g === "male" ? "♂" : g === "female" ? "♀" : "?"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="p-1.5 rounded hover:bg-white/10 text-slate-400 transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-500 w-10 text-center" style={{ fontSize: "0.75rem" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1.5 rounded hover:bg-white/10 text-slate-400 transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 transition-colors" title="Reset zoom">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center p-4"
        style={{ background: "#050508" }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.1s",
          }}
        >
          <div
            ref={containerRef}
            className={`relative select-none shadow-2xl ${addMode ? "cursor-crosshair" : "cursor-default"}`}
            style={{ display: "inline-block" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={addMode ? handleAddBlock : handleCanvasClick}
          >
            <img
              src={imageUrl}
              alt="Comic page"
              className="block max-w-full"
              style={{ maxHeight: "75vh", userSelect: "none", display: "block" }}
              draggable={false}
            />

            {/* Text blocks overlay */}
            {textBlocks.map((block) => {
              const isSelected = block.id === selectedBlockId;
              const isEditing = block.id === editingId;
              const genderColor = GENDER_COLORS[block.speakerGender];

              return (
                <div
                  key={block.id}
                  style={{
                    position: "absolute",
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.width}%`,
                    minHeight: `${block.height}%`,
                    boxSizing: "border-box",
                    cursor: isEditing ? "text" : "grab",
                    zIndex: isSelected ? 20 : 10,
                  }}
                  onMouseDown={(e) => !isEditing && handleBlockMouseDown(e, block)}
                  onDoubleClick={() => handleDoubleClick(block)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Block */}
                  <div
                    style={{
                      background: block.bgColor === "transparent" ? "rgba(255,255,255,0)" : block.bgColor,
                      border: isSelected
                        ? `2px solid ${genderColor}`
                        : "1.5px solid rgba(255,255,255,0.15)",
                      borderRadius: "6px",
                      padding: "4px 6px",
                      minHeight: "100%",
                      boxShadow: isSelected ? `0 0 0 1px ${genderColor}40, 0 4px 16px rgba(0,0,0,0.4)` : "none",
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === "Escape") { setEditingId(null); } }}
                        className="w-full bg-transparent resize-none outline-none"
                        style={{
                          fontFamily: "'Sarabun', sans-serif",
                          fontSize: `${block.fontSize}px`,
                          color: block.color,
                          lineHeight: 1.4,
                          minHeight: "2em",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p
                        style={{
                          fontFamily: "'Sarabun', sans-serif",
                          fontSize: `${block.fontSize}px`,
                          color: block.color,
                          lineHeight: 1.4,
                          margin: 0,
                          wordBreak: "break-word",
                        }}
                      >
                        {block.translated || (
                          <span style={{ opacity: 0.4 }}>empty</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Gender indicator dot */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: -6,
                        left: -6,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: genderColor,
                        border: "2px solid #0a0a14",
                      }}
                    />
                  )}

                  {/* Resize handle */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, block)}
                      style={{
                        position: "absolute",
                        right: -5,
                        bottom: -5,
                        width: 12,
                        height: 12,
                        background: genderColor,
                        border: "2px solid #0a0a14",
                        borderRadius: "3px",
                        cursor: "se-resize",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {addMode && (
        <div className="px-4 py-2 bg-violet-600/10 border-t border-violet-500/20 text-violet-400 text-center" style={{ fontSize: "0.75rem" }}>
          Click anywhere on the image to add a new text block. Press <kbd className="bg-violet-900/40 px-1 rounded">Esc</kbd> or click "Add Block" again to exit.
        </div>
      )}
    </div>
  );
}
