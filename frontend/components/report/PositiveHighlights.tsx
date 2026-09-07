"use client";

import { Award, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface PositiveHighlightsProps {
  highlights: string[];
}

export function PositiveHighlights({ highlights = [] }: PositiveHighlightsProps) {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <h3 className="font-heading text-lg font-bold text-text-primary">
          High-Retention Strengths
        </h3>
        <Badge variant="success" className="text-[10px]">
          Benchmark Outperformers
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {highlights.map((hl, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-cozy space-y-2"
          >
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Retention Anchor #{i + 1}</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">{hl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
