"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Video,
  Sparkles,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react";

export interface CliffData {
  timestamp: string;
  percent: number; // timeline position 0-100
  seconds: number;
  dropAmount: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  reason: string;
  prescription: string;
  curveYPct: number; // 0-100% from top
}

const SAMPLE_CLIFFS: CliffData[] = [
  {
    timestamp: "01:24",
    percent: 22,
    seconds: 84,
    dropAmount: "-28.4%",
    severity: "CRITICAL",
    reason:
      "Pacing breakdown: 16 contiguous seconds of static talking-head without B-roll, screen capture, or sound cue pattern interrupt.",
    prescription:
      "Punch in with a 1.2x digital zoom at 01:20 and overlay a kinetic retention hook diagram.",
    curveYPct: 35,
  },
  {
    timestamp: "04:38",
    percent: 52,
    seconds: 278,
    dropAmount: "-19.1%",
    severity: "HIGH",
    reason:
      "Unannounced sponsor segue: Sudden energy drop, abrupt audio level dip, and visual disconnect caused immediate viewer churn.",
    prescription:
      "Bridge transition with a 3-second contextual narrative teaser before displaying brand sponsor.",
    curveYPct: 62,
  },
  {
    timestamp: "08:15",
    percent: 81,
    seconds: 495,
    dropAmount: "-14.2%",
    severity: "MEDIUM",
    reason:
      "Premature video wrap-up cues: Creator stated 'In summary...' 2 minutes before the actual conclusion.",
    prescription:
      "Maintain active story momentum and reserve wrap-up cues strictly for the final 12 seconds.",
    curveYPct: 83,
  },
];

const TOTAL_DURATION_SECONDS = 624; // 10m 24s

/**
 * Smooth mathematical model using piecewise Hermite/smoothstep interpolation.
 * Guarantees C1 continuous derivatives so the tracking dot glides smoothly without sharp jerks.
 */
interface Knot {
  x: number;
  y: number; // 0 to 100%
  ret: number; // 0 to 100%
}

const KNOTS: Knot[] = [
  { x: 0, y: 10, ret: 98 },
  { x: 16, y: 20, ret: 86 },
  { x: 20, y: 24, ret: 82 }, // Cliff 1 entry
  { x: 25, y: 48, ret: 56 }, // Cliff 1 drop (-28.4%)
  { x: 48, y: 54, ret: 51 }, // Plateau 1
  { x: 50, y: 57, ret: 50 }, // Cliff 2 entry
  { x: 55, y: 72, ret: 31 }, // Cliff 2 drop (-19.1%)
  { x: 77, y: 76, ret: 28 }, // Plateau 2
  { x: 79, y: 78, ret: 28 }, // Cliff 3 entry
  { x: 84, y: 88, ret: 14 }, // Cliff 3 drop (-14.2%)
  { x: 100, y: 92, ret: 10 }, // Outro tail
];

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function getCurveCoordinates(p: number): { yPct: number; retentionPct: number } {
  const clampP = Math.max(0, Math.min(100, p));

  // Find bounding knots
  let idx = 0;
  for (let i = 0; i < KNOTS.length - 1; i++) {
    if (clampP >= KNOTS[i].x && clampP <= KNOTS[i + 1].x) {
      idx = i;
      break;
    }
  }

  const k0 = KNOTS[idx];
  const k1 = KNOTS[Math.min(idx + 1, KNOTS.length - 1)];

  if (k0.x === k1.x) {
    return { yPct: k0.y, retentionPct: k0.ret };
  }

  const t = smoothstep(k0.x, k1.x, clampP);
  const yPct = k0.y + t * (k1.y - k0.y);
  const retentionPct = Math.round(k0.ret + t * (k1.ret - k0.ret));

  return { yPct, retentionPct };
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ScenePlaceholder() {
  const [activeCliff, setActiveCliff] = useState<CliffData>(SAMPLE_CLIFFS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // 0 to 100%
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);

  const timelineRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Check if playhead has crossed a cliff and auto-select it
  const checkCrossedCliff = useCallback((progress: number) => {
    for (const cliff of SAMPLE_CLIFFS) {
      if (Math.abs(progress - cliff.percent) < 2.5) {
        setActiveCliff(cliff);
        break;
      }
    }
  }, []);

  // Smooth 60fps playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    // Standard simulation duration: 16 seconds (or 8s at 2x)
    const baseDurationMs = 16000 / speedMultiplier;

    const tick = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const delta = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setPlayProgress((prev) => {
        const next = prev + (delta / baseDurationMs) * 100;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        checkCrossedCliff(next);
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, checkCrossedCliff]);

  // Click on timeline to scrub
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setPlayProgress(newProgress);
    checkCrossedCliff(newProgress);
  };

  // Hover scrub preview
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setHoverX(x);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveCliff(SAMPLE_CLIFFS[0]);
  };

  const currentSeconds = (playProgress / 100) * TOTAL_DURATION_SECONDS;
  const currentTimestamp = formatSeconds(currentSeconds);
  const { yPct: currentYPct, retentionPct: currentRetention } = getCurveCoordinates(playProgress);

  const hoverSeconds = hoverX !== null ? (hoverX / 100) * TOTAL_DURATION_SECONDS : 0;
  const hoverTimestamp = formatSeconds(hoverSeconds);
  const hoverRetention = hoverX !== null ? getCurveCoordinates(hoverX).retentionPct : 0;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white border border-stone-800/[0.08] shadow-card overflow-hidden text-left transition-all duration-300">
      {/* Visualizer Header Bar */}
      <div className="px-6 py-4 border-b border-stone-800/[0.06] bg-[#FAF8F5]/90 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/70 flex items-center justify-center text-accent shadow-sm">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary flex items-center space-x-2">
              <span>Why I Engineered 1M Views.mp4</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-medium">
                Forensics Complete
              </span>
            </div>
            <div className="text-xs font-mono text-text-tertiary">
              1080p60 • Duration: 10:24 • Overall Retention: 62.4%
            </div>
          </div>
        </div>

        {/* Controls: Play/Pause, Speed, Reset & Live Readout */}
        <div className="flex items-center space-x-2">
          {/* Live Telemetry Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-orange-50 border border-orange-200/80 text-xs font-mono text-accent font-semibold shadow-xs">
            <Activity className="w-3.5 h-3.5 animate-pulse text-accent" />
            <span>
              {currentTimestamp} <span className="text-stone-400">|</span> {currentRetention}%
            </span>
          </div>

          {/* Speed Toggle */}
          <button
            onClick={() => setSpeedMultiplier((s) => (s === 1 ? 2 : 1))}
            className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-xs font-mono text-text-secondary transition-colors cursor-pointer shadow-2xs"
            title="Toggle simulation speed (1x / 2x)"
          >
            <Zap className="w-3 h-3 mr-1 text-amber-500" />
            <span>{speedMultiplier}x</span>
          </button>

          {/* Reset */}
          {playProgress > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300/80 text-text-secondary transition-colors cursor-pointer shadow-cozy"
              title="Reset simulation to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Primary Play/Pause Button */}
          <button
            onClick={() => {
              if (playProgress >= 100) setPlayProgress(0);
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer shadow-cozy active:scale-95 ${
              isPlaying
                ? "bg-accent text-white border-accent-dark shadow-glow-subtle font-semibold"
                : "bg-white hover:bg-stone-50 border-stone-300/80 text-text-primary"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-accent" />
                <span>{playProgress > 0 ? "Resume" : "Simulate"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Chart Container */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#FAF8F5]/80 via-white to-white border border-stone-800/[0.07] p-5 sm:p-6 shadow-cozy select-none">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-editorial-grid opacity-25 pointer-events-none rounded-2xl" />

          {/* Top & Right Gutter Guide Labels */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-text-tertiary mb-3 pointer-events-none px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <strong className="text-text-primary font-medium">Intro Hook Target</strong> (85%+)
            </span>
            <div className="flex items-center gap-4 text-stone-400 text-[10px]">
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Interactive Plot Area */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-60 w-full cursor-crosshair overflow-hidden rounded-xl bg-stone-50/40 border border-stone-200/60"
          >
            {/* Horizontal Retention Guideline Grid */}
            <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-40">
              <div className="w-full border-b border-dashed border-stone-300" />
              <div className="w-full border-b border-dashed border-stone-300" />
              <div className="w-full border-b border-dashed border-stone-300" />
              <div className="w-full border-b border-dashed border-stone-300" />
            </div>

            {/* Active Cliff Background Highlight Glow */}
            <div
              style={{ left: `${activeCliff.percent}%` }}
              className="absolute top-0 bottom-0 w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-red-500/[0.07] to-transparent pointer-events-none transition-all duration-300"
            />

            {/* Silky-Smooth SVG Spline Retention Curve */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 1000 300"
            >
              <defs>
                {/* Curve Color Gradient: Warm Obsidian -> Vivid Crimson -> Terracotta */}
                <linearGradient id="curveGradientPro" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1C1917" />
                  <stop offset="16%" stopColor="#1C1917" />
                  <stop offset="22%" stopColor="#DC2626" />
                  <stop offset="28%" stopColor="#DC2626" />
                  <stop offset="48%" stopColor="#D95A2B" />
                  <stop offset="54%" stopColor="#DC2626" />
                  <stop offset="78%" stopColor="#D95A2B" />
                  <stop offset="84%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#78716C" />
                </linearGradient>

                {/* Soft Area Fill Gradient */}
                <linearGradient id="areaGradientPro" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(217, 90, 43, 0.22)" />
                  <stop offset="60%" stopColor="rgba(217, 90, 43, 0.06)" />
                  <stop offset="100%" stopColor="rgba(217, 90, 43, 0.0)" />
                </linearGradient>
              </defs>

              {/* Shaded Area Under Curve */}
              <path
                d="M 0,30 C 80,35 150,55 180,66 C 200,74 210,80 220,95 C 230,115 240,140 260,150 C 340,158 440,165 480,168 C 500,170 510,180 520,195 C 530,210 540,218 560,220 C 640,223 720,226 770,228 C 790,230 800,240 810,252 C 820,264 830,268 850,270 C 900,274 960,277 1000,280 L 1000,300 L 0,300 Z"
                fill="url(#areaGradientPro)"
              />

              {/* Main Continuous Bézier Retention Curve */}
              <path
                d="M 0,30 C 80,35 150,55 180,66 C 200,74 210,80 220,95 C 230,115 240,140 260,150 C 340,158 440,165 480,168 C 500,170 510,180 520,195 C 530,210 540,218 560,220 C 640,223 720,226 770,228 C 790,230 800,240 810,252 C 820,264 830,268 850,270 C 900,274 960,277 1000,280"
                fill="none"
                stroke="url(#curveGradientPro)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>

            {/* Cliff Annotation Markers (Positioned Above Curve with Vertical Stem) */}
            {SAMPLE_CLIFFS.map((cliff) => {
              const isSelected = activeCliff.timestamp === cliff.timestamp;
              return (
                <div
                  key={cliff.timestamp}
                  style={{ left: `${cliff.percent}%` }}
                  className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center z-10 -translate-x-1/2"
                >
                  {/* Dotted Vertical Stem line down to curve */}
                  <div
                    style={{ height: `${cliff.curveYPct}%` }}
                    className={`w-px border-l-2 border-dashed transition-colors duration-200 ${
                      isSelected ? "border-red-500" : "border-stone-300"
                    }`}
                  />

                  {/* Marker Dot on the Curve */}
                  <div
                    style={{ top: `${cliff.curveYPct}%` }}
                    className={`absolute -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all duration-200 pointer-events-auto cursor-pointer ${
                      isSelected
                        ? "bg-red-600 ring-4 ring-red-200 scale-125"
                        : "bg-white border-2 border-red-500 hover:scale-110"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCliff(cliff);
                      setPlayProgress(cliff.percent);
                    }}
                    title={`Inspect Cliff at ${cliff.timestamp}`}
                  />

                  {/* Top Flag Tag */}
                  <div
                    style={{ top: `${Math.max(6, cliff.curveYPct - 24)}%` }}
                    className="absolute -translate-y-1/2 pointer-events-auto"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCliff(cliff);
                        setPlayProgress(cliff.percent);
                      }}
                      className={`group flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-red-600 text-white shadow-md ring-2 ring-red-300 scale-105"
                          : "bg-white/95 hover:bg-white text-stone-700 border border-stone-200 hover:border-red-300"
                      }`}
                    >
                      <TrendingDown className={`w-3 h-3 ${isSelected ? "text-white" : "text-red-500"}`} />
                      <span className="font-semibold">{cliff.timestamp}</span>
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                          isSelected ? "bg-red-700 text-white" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {cliff.dropAmount}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Hover Scrub Line Preview (When Mouse Enters Timeline) */}
            {hoverX !== null && (
              <div
                style={{ left: `${hoverX}%` }}
                className="absolute top-0 bottom-0 pointer-events-none z-15 -translate-x-1/2"
              >
                <div className="w-[1px] h-full bg-stone-400/60 border-l border-dashed border-stone-400" />
                <div className="absolute top-2 -translate-x-1/2 px-2 py-0.5 rounded bg-stone-900/85 text-white text-[10px] font-mono shadow-sm whitespace-nowrap">
                  {hoverTimestamp} • {hoverRetention}%
                </div>
              </div>
            )}

            {/* Active Simulation Playhead (Clean Hairline + Perfectly Geometric Circular Dot) */}
            {playProgress > 0 && (
              <div
                style={{ left: `${playProgress}%` }}
                className="absolute top-0 bottom-0 pointer-events-none z-20 -translate-x-1/2 transition-none"
              >
                {/* 1.5px Hairline with Soft Terracotta Bloom */}
                <div className="w-[1.5px] h-full bg-accent shadow-[0_0_8px_rgba(217,90,43,0.7)]" />

                {/* Floating Telemetry Pill */}
                <div className="absolute top-2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-mono shadow-md border border-stone-700 flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping inline-block mr-0.5" />
                  <span>{currentTimestamp}</span>
                  <span className="text-stone-400 font-light">•</span>
                  <span className="text-accent font-semibold">{currentRetention}%</span>
                </div>

                {/* Flawless Circular Playhead Tracking Dot (Guaranteed Never Squashed) */}
                <div
                  style={{ top: `${currentYPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                >
                  {/* Expanding Pulse Ring */}
                  <span className="absolute w-7 h-7 rounded-full bg-accent/25 animate-ping pointer-events-none" />

                  {/* Outer White Housing */}
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-card flex items-center justify-center border border-stone-300">
                    {/* Inner Terracotta Accent Bead */}
                    <div className="w-2.5 h-2.5 rounded-full bg-accent ring-1 ring-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom X-Axis Timeline Markers */}
          <div className="relative z-10 flex justify-between text-[11px] font-mono text-text-tertiary pt-3 border-t border-stone-800/[0.06] mt-1 pointer-events-none px-1">
            <span className="font-medium text-text-secondary">00:00 (Intro)</span>
            <span>02:30</span>
            <span>05:00</span>
            <span>07:30</span>
            <span className="font-medium text-text-secondary">10:24 (Outro)</span>
          </div>
        </div>

        {/* Selected Cliff Forensic Diagnosis Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-stone-800/[0.07] space-y-3 shadow-cozy transition-all duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-semibold text-text-primary">
                  Cliff Diagnosis at {activeCliff.timestamp} ({activeCliff.dropAmount} Drop)
                </span>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800">
                  {activeCliff.severity}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono text-accent-dark bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/80 font-medium shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Gemini 3.8 Flash Multimodal Audit</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-8">
            {activeCliff.reason}
          </p>

          <div className="flex items-start space-x-2 pt-1 pl-8 text-xs text-text-primary">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              <strong className="text-emerald-800 font-semibold">Prescription:</strong> {activeCliff.prescription}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
