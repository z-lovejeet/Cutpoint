"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  Volume2,
  FastForward,
  Film,
  ShieldCheck,
  Wrench,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { CliffAnalysis } from "@/types/database";

interface CliffCardProps {
  cliffReport: CliffAnalysis;
  index: number;
}

export function CliffCard({ cliffReport, index }: CliffCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(index === 0);

  const {
    cliff,
    root_cause,
    visual_analysis,
    audio_analysis,
    pacing_analysis,
    content_analysis,
    confidence_score,
    critic_approved,
    recommendations = [],
    evidence_chain = [],
  } = cliffReport;

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL":
        return "danger";
      case "HIGH":
        return "accent";
      case "MEDIUM":
        return "warning";
      default:
        return "neutral";
    }
  };

  return (
    <Card className="overflow-hidden border border-stone-800/[0.08] bg-white shadow-cozy transition-all duration-200">
      {/* Clickable Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 cursor-pointer select-none hover:bg-stone-50/50 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getSeverityBadgeVariant(cliff.severity)} dot>
                <span>{cliff.severity} SEVERITY</span>
              </Badge>

              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-text-primary border border-stone-200">
                {formatSeconds(cliff.timestamp_start)} — {formatSeconds(cliff.timestamp_end)}
              </span>

              <span className="font-mono text-xs font-bold text-danger">
                -{cliff.drop_percentage}% Drop
              </span>

              {critic_approved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Critic Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Adversarial Review</span>
                </span>
              )}
            </div>

            <h3 className="font-heading text-base sm:text-lg font-bold text-text-primary pt-1">
              {root_cause || "Audience disengagement cliff"}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-mono text-text-tertiary">Confidence</div>
              <div className="font-mono text-xs font-bold text-accent">
                {Math.round((confidence_score || 0.85) * 100)}%
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-text-secondary">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Forensic Deep Dive */}
      {isExpanded && (
        <div className="border-t border-black/[0.05] p-5 sm:p-6 bg-stone-50/40 space-y-6">
          {/* 4-Pillar Forensic Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual Forensics */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Multimodal Visual Findings</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {visual_analysis || "No severe visual stagnancy was flagged for this window."}
              </p>
            </div>

            {/* Audio & Cadence Forensics */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>Acoustic &amp; Cadence Findings</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {audio_analysis || "Acoustic volume and cadence metrics remained stable."}
              </p>
            </div>

            {/* Pacing Forensics */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <FastForward className="w-4 h-4 text-sky-600" />
                <span>Pacing &amp; Edit Rhythm</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {pacing_analysis || "Cut rhythm aligned with typical retention norms."}
              </p>
            </div>

            {/* Content & Tangent Forensics */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Film className="w-4 h-4 text-purple-600" />
                <span>Narrative Coherence</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {content_analysis || "Topic progression matched overarching video promise."}
              </p>
            </div>
          </div>

          {/* Evidence Chain */}
          {evidence_chain && evidence_chain.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-text-primary">
                  Agent Evidence Chain
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidence_chain.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-black/[0.05] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                      <span className="font-semibold text-accent-dark">
                        {ev.source_agent} {ev.tool_name ? `• ${ev.tool_name}` : ""}
                      </span>
                      <span>{Math.round((ev.confidence || 0.8) * 100)}% Conf.</span>
                    </div>
                    <p className="text-text-secondary text-xs">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptive Recommendations for this Cliff */}
          {recommendations && recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-accent-dark">
                <Wrench className="w-3.5 h-3.5" />
                <span>Prescription for Timestamp {formatSeconds(cliff.timestamp_start)}</span>
              </div>
              <ul className="space-y-1.5">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
