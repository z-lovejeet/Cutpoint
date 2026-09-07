"use client";

import * as React from "react";
import { Eye, Volume2, FastForward, Film, Anchor } from "lucide-react";
import type { HealthScore } from "@/types/database";

interface ScoreBreakdownProps {
  score: HealthScore;
}

interface CategoryMetric {
  key: keyof HealthScore;
  label: string;
  icon: React.ReactNode;
  value: number;
  description: string;
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const metrics: CategoryMetric[] = [
    {
      key: "hook_score",
      label: "Hook Retention (0-30s)",
      icon: <Anchor className="w-4 h-4 text-accent" />,
      value: score.hook_score ?? 50,
      description: "First 30 seconds viewer grip and drop protection",
    },
    {
      key: "visual_score",
      label: "Visual Dynamism",
      icon: <Eye className="w-4 h-4 text-emerald-600" />,
      value: score.visual_score ?? 50,
      description: "B-roll variety, frame movement, and stagnancy defense",
    },
    {
      key: "pacing_score",
      label: "Edit Pacing & Rhythm",
      icon: <FastForward className="w-4 h-4 text-sky-600" />,
      value: score.pacing_score ?? 50,
      description: "Cut frequencies and story velocity between segments",
    },
    {
      key: "audio_score",
      label: "Audio & Vocal Cadence",
      icon: <Volume2 className="w-4 h-4 text-amber-600" />,
      value: score.audio_score ?? 50,
      description: "Dead air prevention, speech pace, and vocal energy",
    },
    {
      key: "content_score",
      label: "Narrative Coherence",
      icon: <Film className="w-4 h-4 text-purple-600" />,
      value: score.content_score ?? 50,
      description: "Topic flow without off-theme tangents and rambling",
    },
  ];

  const getBarColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 65) return "bg-sky-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-danger";
  };

  return (
    <div className="space-y-4">
      {metrics.map((m) => (
        <div key={m.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {m.icon}
              <span className="font-semibold text-text-primary">{m.label}</span>
            </div>
            <span className="font-mono font-bold text-text-primary">
              {Math.round(m.value)}/100
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(
                m.value
              )}`}
              style={{ width: `${Math.max(4, Math.min(100, m.value))}%` }}
            />
          </div>

          <p className="text-[11px] text-text-tertiary">{m.description}</p>
        </div>
      ))}
    </div>
  );
}
