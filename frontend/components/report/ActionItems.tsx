"use client";

import * as React from "react";
import { CheckSquare, Square, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ActionItem } from "@/types/database";

interface ActionItemsProps {
  items: ActionItem[];
  onTimestampClick?: (timestamp: string) => void;
}

export function ActionItems({ items = [], onTimestampClick }: ActionItemsProps) {
  const [completedIndices, setCompletedIndices] = React.useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCompletedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "P0":
      case "CRITICAL":
        return "danger";
      case "P1":
      case "HIGH":
        return "accent";
      default:
        return "neutral";
    }
  };

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "HOOK":
        return "accent";
      case "VISUAL":
        return "success";
      case "AUDIO":
        return "warning";
      case "PACING":
        return "info";
      default:
        return "neutral";
    }
  };

  if (!items || items.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-text-tertiary">
        No immediate critical action items prescribed.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isChecked = !!completedIndices[idx];

        return (
          <div
            key={idx}
            onClick={() => toggleCheck(idx)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
              isChecked
                ? "bg-stone-100/60 border-stone-200 opacity-60 line-through"
                : "bg-white border-stone-800/[0.08] hover:border-accent/40 hover:shadow-card shadow-cozy"
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Checkbox button */}
              <button
                type="button"
                className={`mt-0.5 shrink-0 transition-colors ${
                  isChecked ? "text-emerald-600" : "text-stone-400 hover:text-accent"
                }`}
                aria-label="Toggle action item"
              >
                {isChecked ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>

              {/* Item Content */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getPriorityBadgeVariant(item.priority)} className="text-[10px]">
                    {item.priority} PRIORITY
                  </Badge>

                  <Badge variant={getCategoryBadgeVariant(item.category)} className="text-[10px]">
                    {item.category}
                  </Badge>

                  {item.related_cliff_timestamp && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimestampClick?.(item.related_cliff_timestamp!);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-accent-dark bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{item.related_cliff_timestamp}</span>
                    </span>
                  )}
                </div>

                <p className={`text-xs sm:text-sm text-text-primary leading-relaxed ${isChecked ? "line-through text-text-tertiary" : "font-medium"}`}>
                  {item.description}
                </p>

                {item.expected_impact && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200/60 w-fit">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Expected Impact: {item.expected_impact}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
