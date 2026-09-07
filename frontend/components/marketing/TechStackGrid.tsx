"use client";

import React from "react";
import { Cpu, Terminal, Sparkles, Zap, Database, Activity, type LucideIcon } from "lucide-react";

interface TechItem {
  name: string;
  category: string;
  version: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: "Gemini 3.8 Flash",
    category: "Multimodal Video & Audio",
    version: "Google GenAI SDK",
    description: "Perception-action-reflection loops analyzing 1080p60 frames, visual stagnancy, and speech cadence with tool calling.",
    icon: Sparkles,
    iconBg: "bg-orange-50 border-orange-200/80 text-accent",
  },
  {
    name: "Groq LPU Acceleration",
    category: "Reasoning & Debate",
    version: "GPT-OSS 120B & 20B",
    description: "Powers the Supervisor, Retention Critic, Report Synthesizer, and Strategist Chat agents with sub-second structured generation.",
    icon: Zap,
    iconBg: "bg-amber-50 border-amber-200/80 text-amber-800",
  },
  {
    name: "Next.js 15 + React 19",
    category: "Client & Presentation",
    version: "App Router / SSR",
    description: "Server-side session rendering, Framer Motion page transitions, GSAP scroll triggers, and warm editorial typography.",
    icon: Terminal,
    iconBg: "bg-stone-100 border-stone-200/80 text-stone-800",
  },
  {
    name: "FastAPI + Python 3.12",
    category: "Control Plane",
    version: "AsyncIO Engine",
    description: "High-throughput asynchronous orchestrator coordinating parallel agent dispatch, streaming endpoints, and state machines.",
    icon: Cpu,
    iconBg: "bg-orange-50 border-orange-200/80 text-accent-dark",
  },
  {
    name: "SciPy & NumPy",
    category: "Signal Processing",
    version: "Calculus Ensemble",
    description: "Gaussian smoothing, first-derivative negative gradient discovery, sliding window drop detection, and z-score anomaly filters.",
    icon: Activity,
    iconBg: "bg-rose-50 border-rose-200/80 text-rose-700",
  },
  {
    name: "Supabase PostgreSQL",
    category: "Persistence & Security",
    version: "Row-Level Security (RLS)",
    description: "Isolated tenant vaults, granular RLS policies for video metadata and retention reports, and GitHub OAuth session sync.",
    icon: Database,
    iconBg: "bg-emerald-50 border-emerald-200/80 text-emerald-800",
  },
];

export function TechStackGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full text-left">
      {TECH_STACK.map((tech) => {
        const Icon = tech.icon;
        return (
          <div
            key={tech.name}
            className="cozy-card cozy-card-hover p-6 rounded-2xl flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${tech.iconBg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-text-tertiary px-2 py-0.5 rounded bg-stone-100/90 border border-stone-200/60">
                  {tech.version}
                </span>
              </div>

              <div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {tech.name}
                </h3>
                <p className="text-xs font-mono text-text-tertiary pt-0.5">
                  {tech.category}
                </p>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {tech.description}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800/[0.05] flex items-center justify-between text-[11px] font-mono text-text-tertiary">
              <span>Production Integration</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TechStackGrid;
