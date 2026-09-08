"use client";

import * as React from "react";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  Film,
  Zap,
  CheckCircle2,
  Database,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { rewriteScript } from "@/lib/api";
import type { ForensicReport, ScriptRewriteResponse } from "@/types/database";

interface ScriptDoctorSectionProps {
  report: ForensicReport;
  onReportUpdate?: (updatedReport: ForensicReport) => void;
}

type RewriteMode = "hook" | "cliff" | "whole_script";

export function ScriptDoctorSection({ report, onReportUpdate }: ScriptDoctorSectionProps) {
  const { video, cliff_reports = [] } = report;

  const [mode, setMode] = React.useState<RewriteMode>("hook");
  const [selectedCliffIdx, setSelectedCliffIdx] = React.useState<number>(0);
  const [style, setStyle] = React.useState<"curiosity" | "contrarian" | "direct_value">("curiosity");
  const [customInstructions, setCustomInstructions] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);

  // Active or previously saved rewrite for this mode
  const [currentRewrite, setCurrentRewrite] = React.useState<ScriptRewriteResponse | null>(() => {
    if (report.rewrites && report.rewrites[mode]) {
      return report.rewrites[mode];
    }
    return null;
  });

  // When mode changes, check if we already have a saved rewrite in the database
  React.useEffect(() => {
    if (report.rewrites && report.rewrites[mode]) {
      setCurrentRewrite(report.rewrites[mode]);
    } else {
      // If none saved, set to null until user clicks Generate
      setCurrentRewrite(null);
    }
  }, [mode, report.rewrites]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await rewriteScript(report.report_id, {
        mode,
        cliff_index: selectedCliffIdx,
        style,
        custom_instructions: customInstructions.trim() || undefined,
      });

      setCurrentRewrite(res);

      // Update parent report state if callback provided
      if (onReportUpdate) {
        const updatedRewrites = { ...(report.rewrites || {}), [mode]: res };
        onReportUpdate({
          ...report,
          rewrites: updatedRewrites,
        });
      }

      toast.success(
        `${mode === "hook" ? "Hook" : mode === "cliff" ? "Cliff segment" : "Full script"} rewrite generated & synced to database!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate rewrite";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentRewrite) return;
    navigator.clipboard.writeText(currentRewrite.rewritten_script);
    setCopied(true);
    toast.success("Script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentRewrite || typeof window === "undefined") return;
    const blob = new Blob([currentRewrite.rewritten_script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cutpoint_${mode}_rewrite_${video.video_id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded script file");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 border border-stone-800/[0.08] bg-white shadow-cozy space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="accent">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Script Doctor
              </Badge>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Supabase Synced
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Retention Script Rewriter
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
              Turn forensic drop-off points into magnetic spoken copy. Choose from 3 high-impact
              rewrite modes backed by YouTube retention psychology.
            </p>
          </div>

          {/* 3 Main Mode Selectors */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setMode("hook")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === "hook"
                  ? "bg-white text-text-primary font-bold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              1. Rewrite Hook (0–30s)
            </button>
            <button
              type="button"
              onClick={() => setMode("cliff")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === "cliff"
                  ? "bg-white text-text-primary font-bold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              2. Rewrite Cliff Part
            </button>
            <button
              type="button"
              onClick={() => setMode("whole_script")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === "whole_script"
                  ? "bg-white text-text-primary font-bold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              3. Rewrite Whole Script
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Mode 2 Specific: Cliff Picker */}
          {mode === "cliff" && (
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] font-mono text-text-tertiary block uppercase">
                Target Cliff Drop Zone:
              </label>
              <select
                value={selectedCliffIdx}
                onChange={(e) => setSelectedCliffIdx(Number(e.target.value))}
                className="w-full text-xs font-mono p-2 rounded-lg border border-stone-200 bg-stone-50 text-text-primary focus:ring-1 focus:ring-accent"
              >
                {cliff_reports.map((cr, idx) => {
                  const s = cr.cliff.timestamp_start;
                  const m = Math.floor(s / 60);
                  const sec = Math.floor(s % 60);
                  return (
                    <option key={idx} value={idx}>
                      Cliff {idx + 1} ({String(m).padStart(2, "0")}:{String(sec).padStart(2, "0")}) — -
                      {cr.cliff.drop_percentage.toFixed(1)}% drop
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Style Selector */}
          <div className={`space-y-1 ${mode === "cliff" ? "sm:col-span-1" : "sm:col-span-1"}`}>
            <label className="text-[11px] font-mono text-text-tertiary block uppercase">
              Psychological Delivery Style:
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as "curiosity" | "contrarian" | "direct_value")}
              className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-stone-50 text-text-primary focus:ring-1 focus:ring-accent"
            >
              <option value="curiosity">The Curiosity Loop (MrBeast Style)</option>
              <option value="contrarian">The Contrarian Shock (Ali Abdaal Style)</option>
              <option value="direct_value">The Direct Value Speedrun (Colin & Samir Style)</option>
            </select>
          </div>

          {/* Custom Instructions */}
          <div className={`space-y-1 ${mode === "cliff" ? "sm:col-span-1" : "sm:col-span-2"}`}>
            <label className="text-[11px] font-mono text-text-tertiary block uppercase">
              Custom Director Instructions (Optional):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. emphasize the cost, faster pace, more casual..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-stone-50 text-text-primary focus:ring-1 focus:ring-accent"
              />
              <Button
                variant="accent"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                icon={isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              >
                <span>{isGenerating ? "Rewriting..." : "Generate"}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Generated Script Display Area */}
      {currentRewrite ? (
        <div className="space-y-6">
          {/* Top Result Banner */}
          <Card className="p-6 border border-stone-200/80 bg-white space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {currentRewrite.expected_retention_lift}
                  </Badge>
                  <span className="text-xs font-mono text-text-tertiary">
                    Mode: {mode.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {currentRewrite.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  <span>{copied ? "Copied!" : "Copy Script"}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  <span>Download .txt</span>
                </Button>
              </div>
            </div>

            {/* Original Problem vs Fix Summary */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs font-sans text-amber-950 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-900 block">
                Audience Retention Diagnosis:
              </span>
              <p>{currentRewrite.original_context}</p>
            </div>

            {/* 2-Column: Script on Left, Director Notes & Visual Cues on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Spoken Script (2 Columns) */}
              <div className="lg:col-span-2 space-y-2">
                <span className="text-[11px] font-mono text-text-tertiary block uppercase">
                  Spoken Script & Kinetic Flow:
                </span>
                <div className="p-5 rounded-2xl bg-stone-950 text-stone-100 font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner border border-stone-800 selection:bg-orange-500 selection:text-white">
                  {currentRewrite.rewritten_script}
                </div>
              </div>

              {/* Director's Toolkit (1 Column) */}
              <div className="space-y-4">
                {/* Director's Notes */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-text-tertiary block uppercase">
                    Director&apos;s Execution Notes:
                  </span>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                    {currentRewrite.director_notes?.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 text-text-secondary">
                        <span className="text-accent font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual & Pattern Interrupts */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-text-tertiary block uppercase">
                    Visual Pattern Interrupts:
                  </span>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                    {currentRewrite.visual_cues?.map((cue, i) => (
                      <div key={i} className="flex items-start gap-2 text-text-secondary font-mono text-[11px]">
                        <Film className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span>{cue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Empty State Prompting Generation */
        <Card className="p-12 text-center border border-dashed border-stone-300 bg-stone-50/50 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-accent flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-heading text-base font-bold text-text-primary">
              Ready to generate {mode === "hook" ? "Hook" : mode === "cliff" ? "Cliff segment" : "Whole video"} rewrite
            </h3>
            <p className="text-xs text-text-secondary">
              Click the <strong>Generate</strong> button above to have our Multi-Agent Script Doctor
              rewrite this segment into an empirical, high-retention spoken script.
            </p>
          </div>
          <Button variant="accent" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <span>{isGenerating ? "Rewriting Script..." : "Generate Script Rewrite"}</span>
          </Button>
        </Card>
      )}
    </div>
  );
}
