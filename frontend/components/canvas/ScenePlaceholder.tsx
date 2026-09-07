"use client";

import React, { useState } from "react";
import { Play, Pause, AlertTriangle, CheckCircle2, Video, Sparkles, TrendingDown } from "lucide-react";

interface Cliff {
  timestamp: string;
  percent: number;
  dropAmount: string;
  reason: string;
  prescription: string;
}

const SAMPLE_CLIFFS: Cliff[] = [
  {
    timestamp: "01:24",
    percent: 22,
    dropAmount: "-28.4%",
    reason: "Pacing breakdown: 16s of static talking-head without B-roll or visual pattern interrupt.",
    prescription: "Insert retention hook or animated timeline graphic at 01:20.",
  },
  {
    timestamp: "04:38",
    percent: 52,
    dropAmount: "-19.1%",
    reason: "Unannounced sponsor segue: Sudden tone shift and music drop caused immediate viewer churn.",
    prescription: "Bridge transition with a natural narrative hook before introducing the sponsor.",
  },
  {
    timestamp: "08:15",
    percent: 80,
    dropAmount: "-14.2%",
    reason: "Premature video wrap-up cues: Creator used exit language ('In conclusion...') too early.",
    prescription: "Keep high energy and defer closing remarks to the final 10 seconds.",
  },
];

export default function ScenePlaceholder() {
  const [activeCliff, setActiveCliff] = useState<Cliff>(SAMPLE_CLIFFS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white border border-black/[0.08] shadow-card overflow-hidden text-left">
      {/* Visualizer Header Bar */}
      <div className="px-6 py-4 border-b border-black/[0.06] bg-background-base/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <span>Why I Engineered 1M Views.mp4</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono">
                Analysis Ready
              </span>
            </div>
            <div className="text-xs font-mono text-text-tertiary">
              1080p60 • Duration: 10:24 • Overall Retention: 62.4%
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 border border-black/[0.08] text-xs font-medium text-text-secondary transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause Preview" : "Simulate Timeline"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Retention Curve Canvas Area */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="relative h-48 w-full rounded-xl bg-gradient-to-b from-slate-50 to-white border border-black/[0.05] p-4 flex flex-col justify-between overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-subtle-grid opacity-40" />

          {/* Retention % Guides */}
          <div className="relative z-10 flex justify-between text-[11px] font-mono text-text-tertiary">
            <span>100% (Intro Hook)</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
          </div>

          {/* SVG Smooth Retention Curve */}
          <div className="absolute inset-0 pt-8 pb-6 px-4">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="25%" stopColor="#EF4444" />
                  <stop offset="55%" stopColor="#EF4444" />
                  <stop offset="85%" stopColor="#4F46E5" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(79, 70, 229, 0.12)" />
                  <stop offset="100%" stopColor="rgba(79, 70, 229, 0.0)" />
                </linearGradient>
              </defs>

              {/* Shaded Area under curve */}
              <path
                d="M 0,2 Q 10,4 20,8 L 24,18 Q 35,20 48,22 L 54,30 Q 65,31 78,32 L 82,36 L 100,38 L 100,40 L 0,40 Z"
                fill="url(#areaGradient)"
              />

              {/* Main Retention Line */}
              <path
                d="M 0,2 Q 10,4 20,8 L 24,18 Q 35,20 48,22 L 54,30 Q 65,31 78,32 L 82,36 L 100,38"
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Interactive Cliff Markers */}
          <div className="relative z-10 flex items-center justify-between w-full h-full pointer-events-none">
            {SAMPLE_CLIFFS.map((cliff) => {
              const isSelected = activeCliff.timestamp === cliff.timestamp;
              return (
                <div
                  key={cliff.timestamp}
                  style={{ left: `${cliff.percent}%` }}
                  className="absolute pointer-events-auto -translate-x-1/2 flex flex-col items-center"
                >
                  <button
                    onClick={() => setActiveCliff(cliff)}
                    className={`group relative flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-200 shadow-sm ${
                      isSelected
                        ? "bg-danger text-white ring-4 ring-danger/20 scale-105"
                        : "bg-white hover:bg-neutral-50 text-danger border border-danger/30 hover:scale-105"
                    }`}
                  >
                    <TrendingDown className="w-3 h-3" />
                    <span>{cliff.timestamp}</span>
                  </button>
                  <span className="text-[10px] font-mono text-danger font-semibold mt-1">
                    {cliff.dropAmount}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline Bottom Axis */}
          <div className="relative z-10 flex justify-between text-[11px] font-mono text-text-tertiary pt-2 border-t border-black/[0.05]">
            <span>00:00</span>
            <span>02:30</span>
            <span>05:00</span>
            <span>07:30</span>
            <span>10:24</span>
          </div>
        </div>

        {/* Selected Cliff Forensic Diagnosis Card */}
        <div className="p-5 rounded-xl bg-background-base/70 border border-black/[0.06] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-danger/10 text-danger">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-text-primary">
                Cliff Diagnosis at {activeCliff.timestamp} ({activeCliff.dropAmount} Drop)
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono text-primary bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Multimodal Root Cause</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-8">
            {activeCliff.reason}
          </p>

          <div className="flex items-start space-x-2 pt-1 pl-8 text-xs text-text-primary">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-emerald-700">Prescription:</strong> {activeCliff.prescription}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
