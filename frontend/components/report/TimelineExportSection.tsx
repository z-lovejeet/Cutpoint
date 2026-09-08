"use client";

import * as React from "react";
import {
  Download,
  Copy,
  Check,
  Film,
  FileCode,
  Youtube,
  Settings2,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import type { ForensicReport } from "@/types/database";

interface TimelineExportSectionProps {
  report: ForensicReport;
}

type ExportFormat = "davinci_csv" | "premiere_csv" | "edl" | "youtube_chapters";

export function TimelineExportSection({ report }: TimelineExportSectionProps) {
  const [format, setFormat] = React.useState<ExportFormat>("davinci_csv");
  const [fps, setFps] = React.useState<number>(30);
  const [copied, setCopied] = React.useState(false);

  const { video, cliff_reports = [] } = report;

  // Timecode formatting helper
  const toTimecode = React.useCallback(
    (seconds: number, targetFps: number = 30) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const f = Math.floor((seconds - Math.floor(seconds)) * targetFps);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
        s
      ).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
    },
    []
  );

  // Generate content dynamically in browser (instant, zero-latency)
  const generatedContent = React.useMemo(() => {
    if (format === "davinci_csv") {
      const header = "Record In,Record Out,Marker Name,Comment,Color";
      const rows = cliff_reports.map((cr) => {
        const start = cr.cliff.timestamp_start;
        const end = cr.cliff.timestamp_end || start + 5;
        const drop = cr.cliff.drop_percentage;
        const cause = cr.root_cause.replace(/"/g, '""');
        const fix = (cr.recommendations?.[0] || "Tighten pacing").replace(/"/g, '""');
        const color =
          cr.cliff.severity === "CRITICAL"
            ? "Red"
            : cr.cliff.severity === "HIGH"
            ? "Orange"
            : "Yellow";
        return `"${toTimecode(start, fps)}","${toTimecode(
          end,
          fps
        )}","Cutpoint Drop Zone (${drop.toFixed(1)}%)","${cause}. Fix: ${fix}","${color}"`;
      });
      return [header, ...rows].join("\n");
    }

    if (format === "premiere_csv") {
      const header = "Marker Name,Description,In,Out,Duration,Marker Type";
      const rows = cliff_reports.map((cr, idx) => {
        const start = cr.cliff.timestamp_start;
        const end = cr.cliff.timestamp_end || start + 5;
        const drop = cr.cliff.drop_percentage;
        const cause = cr.root_cause.replace(/"/g, '""');
        const fix = (cr.recommendations?.[0] || "Tighten pacing").replace(/"/g, '""');
        return `"Cliff ${idx + 1} (${drop.toFixed(1)}% Drop)","[Severity: ${
          cr.cliff.severity
        }] ${cause}. Fix: ${fix}",${toTimecode(start, fps)},${toTimecode(
          end,
          fps
        )},${toTimecode(end - start, fps)},Comment`;
      });
      return [header, ...rows].join("\n");
    }

    if (format === "edl") {
      const lines = [
        `TITLE: Cutpoint Retention Markers - ${video.title}`,
        "FCM: NON-DROP FRAME",
        "",
      ];
      cliff_reports.forEach((cr, idx) => {
        const start = cr.cliff.timestamp_start;
        const end = cr.cliff.timestamp_end || start + 5;
        const drop = cr.cliff.drop_percentage;
        const cause = cr.root_cause;
        const tcIn = toTimecode(start, fps);
        const tcOut = toTimecode(end, fps);
        lines.push(
          `${String(idx + 1).padStart(3, "0")}  AX       V     C        ${tcIn} ${tcOut} ${tcIn} ${tcOut}`
        );
        lines.push(`* RED MARKER: Cutpoint Cliff (${drop.toFixed(1)}% Drop) - ${cause}`);
        lines.push("");
      });
      return lines.join("\n");
    }

    // YouTube description chapters format
    const lines = ["00:00 - Introduction & Hook"];
    cliff_reports.forEach((cr) => {
      const start = Math.floor(cr.cliff.timestamp_start);
      const m = Math.floor(start / 60);
      const s = start % 60;
      const cleanCause = cr.root_cause.replace(/^Premature\s+/i, "");
      lines.push(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} - ${cleanCause}`);
    });
    return lines.join("\n");
  }, [format, fps, cliff_reports, video.title, toTimecode]);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      toast.success("Timeline markers copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (typeof window === "undefined") return;

    let extension = "csv";
    let mime = "text/csv";
    if (format === "edl") {
      extension = "edl";
      mime = "text/plain";
    } else if (format === "youtube_chapters") {
      extension = "txt";
      mime = "text/plain";
    }

    const safeTitle = (video.title || "video")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 30);
    const filename = `cutpoint_markers_${safeTitle}.${extension}`;

    const blob = new Blob([generatedContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <Card className="p-6 border border-stone-800/[0.08] bg-white shadow-cozy space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="accent">NLE Export Engine</Badge>
              <span className="text-xs font-mono text-text-tertiary">
                {cliff_reports.length} Timeline Markers Ready
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              One-Click Timeline Markers Export
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
              Import color-coded retention drop markers directly into DaVinci Resolve, Adobe
              Premiere Pro, or YouTube. Never manually scrub for drop timestamps again.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              <span>{copied ? "Copied!" : "Copy Markers"}</span>
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleDownload}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              <span>Download File</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Format Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFormat("davinci_csv")}
          className={`p-4 rounded-xl border text-left transition-all ${
            format === "davinci_csv"
              ? "bg-stone-900 text-white border-stone-900 shadow-md"
              : "bg-white text-text-primary border-stone-200 hover:border-stone-400"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading text-sm font-bold">DaVinci Resolve</span>
            <Film className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-[11px] opacity-80">
            Color-coded CSV markers with root-cause & fix in notes
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFormat("premiere_csv")}
          className={`p-4 rounded-xl border text-left transition-all ${
            format === "premiere_csv"
              ? "bg-stone-900 text-white border-stone-900 shadow-md"
              : "bg-white text-text-primary border-stone-200 hover:border-stone-400"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading text-sm font-bold">Premiere Pro</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-[11px] opacity-80">
            Adobe markers with exact In/Out duration & comments
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFormat("edl")}
          className={`p-4 rounded-xl border text-left transition-all ${
            format === "edl"
              ? "bg-stone-900 text-white border-stone-900 shadow-md"
              : "bg-white text-text-primary border-stone-200 hover:border-stone-400"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading text-sm font-bold">CMX 3600 EDL</span>
            <FileCode className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-[11px] opacity-80">
            Standard timeline list compatible with all major NLEs
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFormat("youtube_chapters")}
          className={`p-4 rounded-xl border text-left transition-all ${
            format === "youtube_chapters"
              ? "bg-stone-900 text-white border-stone-900 shadow-md"
              : "bg-white text-text-primary border-stone-200 hover:border-stone-400"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading text-sm font-bold">YouTube Chapters</span>
            <Youtube className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-[11px] opacity-80">
            Description-ready timestamps to retain dropping viewers
          </p>
        </button>
      </div>

      {/* Frame Rate & NLE Settings */}
      {format !== "youtube_chapters" && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Settings2 className="w-4 h-4 text-stone-500" />
            <span className="font-mono font-semibold">Sequence Frame Rate (FPS):</span>
          </div>
          <div className="flex items-center gap-2">
            {[23.976, 24, 25, 29.97, 30, 60].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setFps(rate)}
                className={`px-3 py-1 rounded-md font-mono text-xs transition-colors ${
                  fps === rate
                    ? "bg-stone-900 text-white font-bold"
                    : "bg-white text-text-secondary border border-stone-200 hover:bg-stone-100"
                }`}
              >
                {rate} fps
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-text-secondary px-1">
          <span>LIVE FILE PREVIEW ({format.toUpperCase()})</span>
          <span>{cliff_reports.length} markers generated</span>
        </div>
        <div className="relative rounded-2xl bg-stone-950 text-stone-100 p-5 font-mono text-xs overflow-x-auto shadow-inner border border-stone-800">
          <pre className="leading-relaxed whitespace-pre font-mono selection:bg-orange-500 selection:text-white">
            {generatedContent}
          </pre>
        </div>
      </div>

      {/* Detailed Marker Inspection Table */}
      <Card className="p-6 border border-stone-200/80 bg-white space-y-4">
        <h3 className="font-heading text-base font-bold text-text-primary">
          Timeline Markers Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-200 text-text-tertiary">
                <th className="pb-3 font-medium">Marker In</th>
                <th className="pb-3 font-medium">Severity</th>
                <th className="pb-3 font-medium">Audience Drop</th>
                <th className="pb-3 font-medium">Diagnosis & Root Cause</th>
                <th className="pb-3 font-medium">Prescribed Fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cliff_reports.map((cr, i) => {
                const start = cr.cliff.timestamp_start;
                const m = Math.floor(start / 60);
                const s = Math.floor(start % 60);
                return (
                  <tr key={i} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 font-bold text-text-primary">
                      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                      <span className="text-[10px] text-text-tertiary block font-normal">
                        {toTimecode(start, fps)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          cr.cliff.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : cr.cliff.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                        }`}
                      >
                        {cr.cliff.severity}
                      </span>
                    </td>
                    <td className="py-3 font-extrabold text-rose-600">
                      -{cr.cliff.drop_percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 text-text-secondary max-w-xs truncate" title={cr.root_cause}>
                      {cr.root_cause}
                    </td>
                    <td className="py-3 text-text-primary max-w-xs truncate" title={cr.recommendations?.[0]}>
                      {cr.recommendations?.[0] || "Tighten pacing and remove dead air"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
