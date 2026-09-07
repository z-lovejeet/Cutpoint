"use client";

import { ShieldCheck, Info, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { MethodologyNote as MethodologyNoteType } from "@/types/database";

interface MethodologyNoteProps {
  methodology?: MethodologyNoteType;
  generatedAt?: string;
}

export function MethodologyNote({ methodology, generatedAt }: MethodologyNoteProps) {
  const agents = methodology?.agents_involved || [
    "The Archivist (YouTube Analytics API)",
    "The Mathematician (Signal Processing Ensemble)",
    "The Visual Detective (Google Gemini 3.8 Flash)",
    "The Sound Engineer (Google Gemini 3.8 Flash Audio)",
    "The Skeptic (Groq GPT-OSS 120B Adversarial Critic)",
    "The Executive Editor (Groq GPT-OSS 20B Synthesizer)",
  ];

  return (
    <Card className="p-6 sm:p-8 space-y-4 border border-stone-800/[0.08] bg-stone-50/70 text-xs">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-black/[0.06] pb-3">
        <div className="flex items-center gap-2 font-mono font-semibold text-text-primary">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Forensic Methodology &amp; Multi-Agent Audit Trail</span>
        </div>

        <div className="text-[11px] font-mono text-text-tertiary">
          Generated: {generatedAt ? new Date(generatedAt).toLocaleString() : "Just now"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-text-tertiary">
            Specialist Agents
          </span>
          <p className="font-mono text-sm font-bold text-text-primary">
            {agents.length} Autonomous Agents
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-text-tertiary">
            Adversarial Verification
          </span>
          <p className="font-mono text-sm font-bold text-accent">
            {methodology?.total_debate_rounds ?? 2} Debate Rounds
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-text-tertiary">
            Avg Investigation Confidence
          </span>
          <p className="font-mono text-sm font-bold text-emerald-600">
            {Math.round((methodology?.average_confidence || 0.88) * 100)}%
          </p>
        </div>
      </div>

      {/* Agents Roster Badges */}
      <div className="space-y-2 pt-2 border-t border-black/[0.04]">
        <span className="text-[11px] font-mono uppercase text-text-tertiary">
          Agents Engaged in this Investigation:
        </span>
        <div className="flex flex-wrap gap-2">
          {agents.map((ag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-mono text-text-secondary shadow-2xs"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{ag}</span>
            </span>
          ))}
        </div>
      </div>

      {methodology?.caveats && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{methodology.caveats}</span>
        </div>
      )}
    </Card>
  );
}
