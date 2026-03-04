import React, { useRef, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize2, MousePointer2, Move } from "lucide-react";
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

const GENDER_LABELS: Record<string, string> = {
  male: "♂",
  female: "♀",
  unknown: "?",
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
  } | null>(null);;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [zoom, setZoom] = useState(1);
  const [addMode, setAddMode] = useState(false);

  const selected = textBlocks.find((b) => b.id === selectedBlockId);

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

  const handleCanvasClick = useCallback(() => {
    if (editingId) return;
    onSelectBlock(null);
  }, [onSelectBlock, editingId]);

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
      setAddMode(false);
    },
    [projectId, pageId, addTextBlock, onSelectBlock]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAddMode(false);
        setEditingId(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockId && !editingId) {
        const input = document.activeElement?.tagName;
        if (input === "INPUT" || input === "TEXTAREA") return;
        deleteTextBlock(projectId, pageId, selectedBlockId);
        onSelectBlock(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBlockId, editingId, projectId, pageId, deleteTextBlock, onSelectBlock]);

  // Global mouse up
  useEffect(() => {
    const up = () => { dragging.current = null; resizing.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: "#04040e" }}>

      {/* ── Main Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{
          height: "44px",
          background: "#09091a",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left: actions */}
        <div className="flex items-center gap-1">
          {/* Pointer / Add toggle */}
          <button
            onClick={() => { setAddMode(false); onSelectBlock(null); }}
            title="Select mode (Esc)"
            className="flex items-center justify-center rounded-lg transition-all"
            style={{
              width: "30px",
              height: "30px",
              background: !addMode ? "rgba(124,58,237,0.2)" : "transparent",
              color: !addMode ? "#a78bfa" : "#475569",
              border: !addMode ? "1px solid rgba(124,58,237,0.35)" : "1px solid transparent",
            }}
            onMouseEnter={(e) => { if (addMode) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}}
            onMouseLeave={(e) => { if (addMode) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setAddMode(!addMode); onSelectBlock(null); }}
            title="Add text block — click on image to place"
            className="flex items-center gap-1.5 px-2.5 rounded-lg transition-all"
            style={{
              height: "30px",
              background: addMode ? "rgba(124,58,237,0.25)" : "transparent",
              color: addMode ? "#c4b5fd" : "#475569",
              border: addMode ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { if (!addMode) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}}
            onMouseLeave={(e) => { if (!addMode) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Block
          </button>

          {selected && (
            <>
              <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              <button
                onClick={() => { deleteTextBlock(projectId, pageId, selected.id); onSelectBlock(null); }}
                className="flex items-center gap-1.5 px-2.5 rounded-lg transition-all"
                style={{ height: "30px", background: "transparent", color: "#475569", border: "1px solid transparent", fontSize: "0.75rem" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.border = "1px solid rgba(239,68,68,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.border = "1px solid transparent"; }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>

        {/* Center: selected block label */}
        <div className="flex-1 flex items-center justify-center">
          {selected ? (
            <span style={{ fontSize: "0.75rem", color: "#475569" }}>
              <span style={{ color: GENDER_COLORS[selected.speakerGender], fontWeight: 600 }}>
                {GENDER_LABELS[selected.speakerGender]}
              </span>
              {" "}Block selected · Double-click to edit · Del to remove
            </span>
          ) : addMode ? (
            <span style={{ fontSize: "0.75rem', color: '#a78bfa" }}>
              Click anywhere on the image to place a text block
            </span>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#1e293b" }}>
              Click a block to select · Double-click to edit text
            </span>
          )}
        </div>

        {/* Right: zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: "28px", height: "28px", color: "#475569" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="rounded-md transition-colors"
            style={{ padding: "2px 6px", color: "#475569", fontSize: "0.6875rem", minWidth: "40px", textAlign: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(Math.min(2.5, zoom + 0.1))}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: "28px", height: "28px", color: "#475569" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: "28px", height: "28px", color: "#475569" }}
            title="Fit to view"
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Block Inspector (when selected) ── */}
      {selected && (
        <div
          className="flex items-center gap-3 px-4 shrink-0 overflow-x-auto"
          style={{
            height: "40px",
            background: "#07071a",
            borderBottom: "1px solid rgba(124,58,237,0.12)",
            minWidth: 0,
          }}
        >
          {/* Gender color dot */}
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: GENDER_COLORS[selected.speakerGender] }}
          />

          {/* Font size */}
          <div className="flex items-center gap-2 shrink-0">
            <span style={{ fontSize: "0.6875rem", color: "#334155" }}>Size</span>
            <input
              type="range"
              min={9}
              max={26}
              value={selected.fontSize}
              onChange={(e) => updateTextBlock(projectId, pageId, selected.id, { fontSize: Number(e.target.value) })}
              style={{ width: "72px", accentColor: "#7c3aed" }}
            />
            <span style={{ fontSize: "0.6875rem", color: "#64748b", width: "18px", textAlign: "right" }}>
              {selected.fontSize}
            </span>
          </div>

          <div className="w-px h-4 shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* BG Color */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span style={{ fontSize: "0.6875rem", color: "#334155" }}>BG</span>
            {["#ffffff", "#000000", "transparent"].map((color) => (
              <button
                key={color}
                onClick={() => updateTextBlock(projectId, pageId, selected.id, { bgColor: color })}
                title={color}
                className="rounded transition-all"
                style={{
                  width: "18px",
                  height: "18px",
                  background: color === "transparent"
                    ? "linear-gradient(135deg, #fff 45%, #f00 45%, #f00 55%, #fff 55%)"
                    : color,
                  outline: selected.bgColor === color ? "2px solid #7c3aed" : "2px solid transparent",
                  outlineOffset: "1px",
                }}
              />
            ))}
          </div>

          <div className="w-px h-4 shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Text Color */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span style={{ fontSize: "0.6875rem", color: "#334155" }}>Text</span>
            {["#000000", "#ffffff", "#dc2626", "#1d4ed8"].map((color) => (
              <button
                key={color}
                onClick={() => updateTextBlock(projectId, pageId, selected.id, { color })}
                title={color}
                className="rounded-full transition-all"
                style={{
                  width: "18px",
                  height: "18px",
                  background: color,
                  outline: selected.color === color ? "2px solid #7c3aed" : "2px solid transparent",
                  outlineOffset: "1px",
                }}
              />
            ))}
          </div>

          <div className="w-px h-4 shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Speaker */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span style={{ fontSize: "0.6875rem", color: "#334155" }}>Speaker</span>
            {(["male", "female", "unknown"] as const).map((g) => (
              <button
                key={g}
                onClick={() => updateTextBlock(projectId, pageId, selected.id, { speakerGender: g })}
                className="rounded-lg transition-all"
                style={{
                  padding: "1px 7px",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  background: selected.speakerGender === g ? `${GENDER_COLORS[g]}25` : "transparent",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: selected.speakerGender === g ? GENDER_COLORS[g] : "rgba(255,255,255,0.07)",
                  color: selected.speakerGender === g ? GENDER_COLORS[g] : "#475569",
                }}
              >
                {GENDER_LABELS[g]} {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Canvas Area ── */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center p-6"
        style={{ background: "#030309" }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.12s ease",
          }}
        >
          <div
            ref={containerRef}
            className="relative select-none"
            style={{
              display: "inline-block",
              cursor: addMode ? "crosshair" : "default",
              borderRadius: "4px",
              overflow: "visible",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 16px 64px rgba(0,0,0,0.7)",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={addMode ? handleAddBlock : handleCanvasClick}
          >
            <img
              src={imageUrl}
              alt="Comic page"
              className="block"
              style={{ maxHeight: "78vh", maxWidth: "100%", display: "block", userSelect: "none" }}
              draggable={false}
            />

            {/* Text blocks overlay */}
            {textBlocks.map((block) => {
              const isSelected = block.id === selectedBlockId;
              const isEditing = block.id === editingId;
              const gColor = GENDER_COLORS[block.speakerGender];

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
                    cursor: isEditing ? "text" : isSelected ? "grab" : "pointer",
                    zIndex: isSelected ? 20 : 10,
                  }}
                  onMouseDown={(e) => !isEditing && handleBlockMouseDown(e, block)}
                  onDoubleClick={() => handleDoubleClick(block)}
                  onClick={(e) => { e.stopPropagation(); if (!isSelected) onSelectBlock(block.id); }}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        inset: "-3px",
                        borderRadius: "8px",
                        border: `1.5px solid ${gColor}`,
                        boxShadow: `0 0 0 1px ${gColor}30, 0 4px 24px rgba(0,0,0,0.5)`,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Block content */}
                  <div
                    style={{
                      background: block.bgColor === "transparent" ? "rgba(255,255,255,0)" : block.bgColor,
                      borderRadius: "5px",
                      padding: "4px 6px",
                      minHeight: "100%",
                      boxSizing: "border-box",
                      outline: !isSelected ? "1px solid rgba(139,92,246,0.25)" : "none",
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                          if (e.key === "Escape") { setEditingId(null); }
                        }}
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
                        {block.translated || <span style={{ opacity: 0.3, fontStyle: "italic" }}>empty</span>}
                      </p>
                    )}
                  </div>

                  {/* Gender indicator dot */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        left: -7,
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: gColor,
                        border: "2px solid #030309",
                        boxShadow: `0 2px 6px ${gColor}60`,
                      }}
                    />
                  )}

                  {/* Move handle */}
                  {isSelected && !isEditing && (
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        right: -7,
                        width: 13,
                        height: 13,
                        borderRadius: "3px",
                        background: "#7c3aed",
                        border: "2px solid #030309",
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Move style={{ width: 7, height: 7, color: "white" }} />
                    </div>
                  )}

                  {/* Resize handle */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, block)}
                      style={{
                        position: "absolute",
                        right: -5,
                        bottom: -5,
                        width: 11,
                        height: 11,
                        background: gColor,
                        border: "2px solid #030309",
                        borderRadius: "2px",
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

      {/* Add mode hint */}
      {addMode && (
        <div
          className="flex items-center justify-center gap-2 py-2 shrink-0"
          style={{ background: "rgba(124,58,237,0.1)", borderTop: "1px solid rgba(124,58,237,0.15)", fontSize: "0.75rem", color: "#a78bfa" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Click anywhere on the image to place a new text block · Press{" "}
          <kbd className="px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.25)", fontSize: "0.6875rem" }}>
            Esc
          </kbd>{" "}
          to cancel
        </div>
      )}
    </div>
  );
}
