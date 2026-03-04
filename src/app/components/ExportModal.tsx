import React, { useState } from "react";
import { X, Download, FileText, Archive, Loader2, CheckCircle, FileSpreadsheet } from "lucide-react";
import { Project } from "../types";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Props {
  project: Project;
  onClose: () => void;
}

type ExportFormat = "zip-images" | "json" | "csv";

const FORMAT_OPTIONS = [
  {
    value: "zip-images" as ExportFormat,
    icon: Archive,
    label: "ZIP Archive",
    desc: "Composited images + translations.json + .csv",
    color: "#7c3aed",
  },
  {
    value: "json" as ExportFormat,
    icon: FileText,
    label: "JSON",
    desc: "Full translation data with positions",
    color: "#6366f1",
  },
  {
    value: "csv" as ExportFormat,
    icon: FileSpreadsheet,
    label: "CSV Spreadsheet",
    desc: "Original + Thai — editable in Excel / Google Sheets",
    color: "#10b981",
  },
];

export function ExportModal({ project, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("zip-images");

  const totalBlocks = project.pages.reduce((s, p) => s + p.textBlocks.length, 0);
  const translatedPages = project.pages.filter((p) => p.aiTranslated).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === "json") await exportJson();
      else if (format === "csv") await exportCsv();
      else await exportZip();
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const exportJson = async () => {
    const data = {
      project: project.name,
      exportedAt: new Date().toISOString(),
      pages: project.pages.map((p) => ({
        name: p.name,
        aiTranslated: p.aiTranslated,
        blocks: p.textBlocks.map((b) => ({
          original: b.original,
          translated: b.translated,
          speakerGender: b.speakerGender,
          position: { x: b.x, y: b.y, width: b.width, height: b.height },
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, `${project.name.replace(/\s+/g, "_")}_translations.json`);
  };

  const exportCsv = async () => {
    const rows: string[][] = [["Page", "Block #", "Original", "Thai Translation", "Speaker Gender", "X%", "Y%", "W%", "H%"]];
    project.pages.forEach((page) => {
      page.textBlocks.forEach((block, i) => {
        rows.push([
          page.name,
          String(i + 1),
          `"${block.original.replace(/"/g, '""')}"`,
          `"${block.translated.replace(/"/g, '""')}"`,
          block.speakerGender,
          String(Math.round(block.x)),
          String(Math.round(block.y)),
          String(Math.round(block.width)),
          String(Math.round(block.height)),
        ]);
      });
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${project.name.replace(/\s+/g, "_")}_translations.csv`);
  };

  const exportZip = async () => {
    const zip = new JSZip();

    const translationsJson = {
      project: project.name,
      exportedAt: new Date().toISOString(),
      pages: project.pages.map((p) => ({
        name: p.name,
        blocks: p.textBlocks.map((b) => ({
          original: b.original,
          translated: b.translated,
          speakerGender: b.speakerGender,
          position: { x: b.x, y: b.y, width: b.width, height: b.height },
        })),
      })),
    };
    zip.file("translations.json", JSON.stringify(translationsJson, null, 2));

    const rows: string[][] = [["Page", "Block #", "Original", "Thai Translation", "Speaker Gender"]];
    project.pages.forEach((page) => {
      page.textBlocks.forEach((block, i) => {
        rows.push([page.name, String(i + 1), `"${block.original.replace(/"/g, '""')}"`, `"${block.translated.replace(/"/g, '""')}"`, block.speakerGender]);
      });
    });
    zip.file("translations.csv", "\uFEFF" + rows.map((r) => r.join(",")).join("\n"));

    const imagesFolder = zip.folder("pages")!;
    for (let i = 0; i < project.pages.length; i++) {
      const page = project.pages[i];
      try {
        const dataUrl = await compositePageImage(page.imageDataUrl, page.textBlocks);
        const base64 = dataUrl.split(",")[1];
        imagesFolder.file(`page_${String(i + 1).padStart(3, "0")}_${page.name}.png`, base64, { base64: true });
      } catch {
        imagesFolder.file(
          `page_${String(i + 1).padStart(3, "0")}_${page.name}_note.txt`,
          "Image could not be composited due to CORS. See translations.json for text data."
        );
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${project.name.replace(/\s+/g, "_")}_export.zip`);
  };

  const compositePageImage = (imageUrl: string, blocks: Project["pages"][0]["textBlocks"]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        blocks.forEach((block) => {
          const x = (block.x / 100) * canvas.width;
          const y = (block.y / 100) * canvas.height;
          const w = (block.width / 100) * canvas.width;
          const h = (block.height / 100) * canvas.height;

          if (block.bgColor !== "transparent") {
            ctx.fillStyle = block.bgColor;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 6);
            ctx.fill();
          }

          ctx.fillStyle = block.color;
          ctx.font = `${block.fontSize * (canvas.width / 600)}px Sarabun, sans-serif`;
          ctx.textBaseline = "top";

          const padding = 6;
          const lineHeight = block.fontSize * (canvas.width / 600) * 1.4;
          let line = "";
          let lineY = y + padding;

          for (const char of block.translated) {
            const testLine = line + char;
            if (ctx.measureText(testLine).width > w - padding * 2 && line.length > 0) {
              ctx.fillText(line, x + padding, lineY);
              line = char;
              lineY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x + padding, lineY);
        });

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = imageUrl;
    });
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
            <h2 className="text-white" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>Export Project</h2>
            <p style={{ fontSize: "0.75rem", color: "#334155", marginTop: "1px" }}>{project.name}</p>
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

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Pages", value: project.pages.length, color: "#7c3aed" },
              { label: "Text Blocks", value: totalBlocks, color: "#6366f1" },
              { label: "AI Translated", value: translatedPages, color: "#10b981" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-white" style={{ fontSize: "1.375rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.6875rem", color: "#334155", marginTop: "2px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Format selection */}
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#94a3b8", marginBottom: "10px" }}>Export format</p>
          <div className="space-y-2 mb-6">
            {FORMAT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 rounded-xl cursor-pointer transition-all"
                style={{
                  padding: "12px 14px",
                  border: format === opt.value
                    ? `1px solid ${opt.color}50`
                    : "1px solid rgba(255,255,255,0.07)",
                  background: format === opt.value
                    ? `${opt.color}10`
                    : "rgba(255,255,255,0.02)",
                }}
                onMouseEnter={(e) => { if (format !== opt.value) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={(e) => { if (format !== opt.value) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                <input
                  type="radio"
                  name="format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={() => setFormat(opt.value)}
                  className="sr-only"
                />
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: format === opt.value ? `${opt.color}25` : "rgba(255,255,255,0.07)" }}
                >
                  <opt.icon className="w-4 h-4" style={{ color: format === opt.value ? opt.color : "#475569" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{opt.label}</p>
                  <p style={{ fontSize: "0.75rem", color: "#475569" }}>{opt.desc}</p>
                </div>
                {format === opt.value && (
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: opt.color }} />
                )}
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
              onClick={handleExport}
              disabled={exporting || done || project.pages.length === 0}
              className="flex-1 rounded-xl py-2.5 transition-all flex items-center justify-center gap-2"
              style={{
                background: done
                  ? "linear-gradient(135deg, #059669, #047857)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 600,
                opacity: exporting || project.pages.length === 0 ? 0.6 : 1,
                cursor: exporting || project.pages.length === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(16,185,129,0.2)",
              }}
            >
              {done ? (
                <><CheckCircle className="w-4 h-4" /> Exported!</>
              ) : exporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4" /> Export</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
