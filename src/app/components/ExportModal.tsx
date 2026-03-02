import React, { useState } from "react";
import { X, Download, FileText, Image, Archive, Loader2, CheckCircle } from "lucide-react";
import { Project } from "../types";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Props {
  project: Project;
  onClose: () => void;
}

type ExportFormat = "zip-images" | "json" | "csv";

export function ExportModal({ project, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("zip-images");

  const totalBlocks = project.pages.reduce((s, p) => s + p.textBlocks.length, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === "json") {
        await exportJson();
      } else if (format === "csv") {
        await exportCsv();
      } else {
        await exportZip();
      }
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
    const rows: string[][] = [["Page", "Block #", "Original", "Thai Translation", "Speaker Gender"]];
    project.pages.forEach((page) => {
      page.textBlocks.forEach((block, i) => {
        rows.push([
          page.name,
          String(i + 1),
          `"${block.original.replace(/"/g, '""')}"`,
          `"${block.translated.replace(/"/g, '""')}"`,
          block.speakerGender,
        ]);
      });
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${project.name.replace(/\s+/g, "_")}_translations.csv`);
  };

  const exportZip = async () => {
    const zip = new JSZip();

    // Add translations JSON
    const translationsJson = {
      project: project.name,
      exportedAt: new Date().toISOString(),
      pages: project.pages.map((p) => ({
        name: p.name,
        blocks: p.textBlocks.map((b) => ({
          original: b.original,
          translated: b.translated,
          speakerGender: b.speakerGender,
        })),
      })),
    };
    zip.file("translations.json", JSON.stringify(translationsJson, null, 2));

    // Add CSV
    const rows: string[][] = [["Page", "Block #", "Original", "Thai Translation", "Speaker Gender"]];
    project.pages.forEach((page) => {
      page.textBlocks.forEach((block, i) => {
        rows.push([page.name, String(i + 1), `"${block.original.replace(/"/g, '""')}"`, `"${block.translated.replace(/"/g, '""')}"`, block.speakerGender]);
      });
    });
    zip.file("translations.csv", "\uFEFF" + rows.map((r) => r.join(",")).join("\n"));

    // Add images with text overlay (canvas composite)
    const imagesFolder = zip.folder("pages")!;

    for (let i = 0; i < project.pages.length; i++) {
      const page = project.pages[i];
      try {
        const dataUrl = await compositePageImage(page.imageDataUrl, page.textBlocks);
        // dataUrl is base64, extract the base64 part
        const base64 = dataUrl.split(",")[1];
        imagesFolder.file(`page_${String(i + 1).padStart(3, "0")}_${page.name}.png`, base64, { base64: true });
      } catch {
        // If compositing fails (e.g. CORS on external URL), add a text file instead
        imagesFolder.file(`page_${String(i + 1).padStart(3, "0")}_${page.name}_note.txt`, "Image could not be composited due to CORS. See translations.json for text data.");
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

        // Draw text blocks
        blocks.forEach((block) => {
          const x = (block.x / 100) * canvas.width;
          const y = (block.y / 100) * canvas.height;
          const w = (block.width / 100) * canvas.width;
          const h = (block.height / 100) * canvas.height;

          // Background
          if (block.bgColor !== "transparent") {
            ctx.fillStyle = block.bgColor;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 6);
            ctx.fill();
          }

          // Text
          ctx.fillStyle = block.color;
          ctx.font = `${block.fontSize * (canvas.width / 600)}px Sarabun, sans-serif`;
          ctx.textBaseline = "top";

          const padding = 6;
          const lineHeight = block.fontSize * (canvas.width / 600) * 1.4;
          const words = block.translated.split("");
          let line = "";
          let lineY = y + padding;

          for (const char of words) {
            const testLine = line + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > w - padding * 2 && line.length > 0) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white" style={{ fontSize: "1.125rem", fontWeight: 600 }}>Export Project</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Pages", value: project.pages.length },
            { label: "Text Blocks", value: totalBlocks },
            { label: "Translated", value: project.pages.filter((p) => p.aiTranslated).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-white" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{stat.value}</div>
              <div className="text-slate-500" style={{ fontSize: "0.6875rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Format selection */}
        <div className="space-y-2 mb-5">
          <p className="text-slate-400 mb-3" style={{ fontSize: "0.875rem" }}>Export format:</p>

          {([
            { value: "zip-images", icon: Archive, label: "ZIP Archive", desc: "Images + translations.json + .csv" },
            { value: "json", icon: FileText, label: "JSON", desc: "Translations data only" },
            { value: "csv", icon: FileText, label: "CSV Spreadsheet", desc: "For editing in Excel / Google Sheets" },
          ] as const).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                format === opt.value
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 hover:border-white/20 bg-white/5"
              }`}
            >
              <input
                type="radio"
                name="format"
                value={opt.value}
                checked={format === opt.value}
                onChange={() => setFormat(opt.value)}
                className="sr-only"
              />
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${format === opt.value ? "bg-violet-600" : "bg-white/10"}`}>
                <opt.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{opt.label}</p>
                <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>{opt.desc}</p>
              </div>
              {format === opt.value && (
                <CheckCircle className="w-4 h-4 text-violet-400 ml-auto" />
              )}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg py-2.5 transition-colors"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || done || project.pages.length === 0}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg py-2.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
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
  );
}
