"use client";

import React from "react";
import {
  Compass,
  DownloadCloud,
  TrendingDown,
  Eye,
  Volume2,
  AlertOctagon,
  FileCheck,
  MessageSquareCode,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface AgentStep {
  step: string;
  name: string;
  role: string;
  model: string;
  description: string;
  tools: string[];
  icon: LucideIcon;
  iconBg: string;
}

const AGENTS: AgentStep[] = [
  {
    step: "01",
    name: "Supervisor Agent",
    role: "Lead Investigator & Dispatcher",
    model: "Groq GPT-OSS 120B",
    description:
      "Formulates the dynamic investigation strategy based on video duration and cliff severity distribution. Dispatches specialists, arbitrates conflicting hypotheses, and evaluates overall confidence.",
    tools: [
      "dispatch_forensic_analysis",
      "dispatch_audio_analysis",
      "request_critic_review",
      "resolve_conflicts",
    ],
    icon: Compass,
    iconBg: "bg-orange-50 border-orange-200/80 text-accent",
  },
  {
    step: "02",
    name: "Data Ingestion Agent",
    role: "The Archivist",
    model: "Pure AsyncIO / YouTube APIs",
    description:
      "Fetches audience retention curves and metadata. Features self-healing token refresh, exponential backoff with jitter, data quality scoring, and anomaly flagging for corrupted curves.",
    tools: [
      "fetch_youtube_metadata",
      "fetch_retention_curve",
      "validate_data_integrity",
      "refresh_oauth_token",
    ],
    icon: DownloadCloud,
    iconBg: "bg-stone-100 border-stone-200/80 text-stone-800",
  },
  {
    step: "03",
    name: "Cliff Detector Agent",
    role: "The Mathematician",
    model: "NumPy & SciPy Signal Processing",
    description:
      "Applies Gaussian filtering, negative 1st derivative thresholding, sliding window comparison, and z-score anomaly filters. Dynamically auto-tunes sensitivity to isolate significant drops.",
    tools: [
      "gaussian_smooth",
      "first_derivative_gradient",
      "sliding_window_drop",
      "zscore_filter",
    ],
    icon: TrendingDown,
    iconBg: "bg-rose-50 border-rose-200/80 text-rose-700",
  },
];

const PARALLEL_AGENTS: [AgentStep, AgentStep] = [
  {
    step: "04",
    name: "Multimodal Forensic Agent",
    role: "The Visual Detective",
    model: "Gemini 3.8 Flash",
    description:
      "Conducts multi-step Perception-Action-Reflection loops. Calls dynamic tools to inspect keyframes, measure visual stagnancy, evaluate framing, and assess edit pacing around drop timestamps.",
    tools: [
      "inspect_keyframes",
      "measure_visual_stagnancy",
      "analyze_transitions",
      "check_cut_frequency",
    ],
    icon: Eye,
    iconBg: "bg-orange-50 border-orange-200/80 text-accent",
  },
  {
    step: "05",
    name: "Audio & Cadence Agent",
    role: "The Sound Engineer",
    model: "Gemini 3.8 Flash",
    description:
      "Performs acoustic forensics on speaker delivery. Detects awkward dead air pauses, sudden drops in words-per-minute (WPM), vocal monotone fatigue, and transcript sentiment disconnects.",
    tools: [
      "analyze_speech_cadence",
      "detect_dead_air",
      "measure_energy_envelope",
      "extract_transcript_sentiment",
    ],
    icon: Volume2,
    iconBg: "bg-amber-50 border-amber-200/80 text-amber-800",
  },
];

const POST_DEBATE_AGENTS: AgentStep[] = [
  {
    step: "06",
    name: "Retention Critic Agent",
    role: "The Skeptic (Adversarial Verification)",
    model: "Groq GPT-OSS 120B",
    description:
      "Acts as the devil's advocate. Generates 2–3 counter-hypotheses for every forensic claim, checks cross-cliff consistency, and initiates debate loops that force re-investigation if evidence is weak.",
    tools: [
      "challenge_finding",
      "cross_examine_evidence",
      "trigger_reinvestigation",
      "issue_final_verdict",
    ],
    icon: AlertOctagon,
    iconBg: "bg-red-50 border-red-200/80 text-danger",
  },
  {
    step: "07",
    name: "Report Synthesizer Agent",
    role: "The Executive Editor",
    model: "Groq GPT-OSS 20B",
    description:
      "Translates validated findings into a cohesive Retention Health Score (0–100), cliff breakdown map, letter grade (A–F), and chronological editing prescriptions with prioritized impact.",
    tools: [
      "compute_health_score",
      "compile_cliff_map",
      "format_prescriptions",
      "rank_priority_action_items",
    ],
    icon: FileCheck,
    iconBg: "bg-emerald-50 border-emerald-200/80 text-emerald-800",
  },
  {
    step: "08",
    name: "Strategist Chat Agent",
    role: "The Studio Advisor",
    model: "Groq GPT-OSS 120B",
    description:
      "Engages in interactive follow-up Q&A grounded strictly in the forensic report. Uses function calling to retrieve specific timestamps, compare cliffs, and explain strategic adjustments.",
    tools: [
      "get_cliff_detail",
      "get_retention_segment",
      "compare_cliffs",
      "get_action_item_detail",
    ],
    icon: MessageSquareCode,
    iconBg: "bg-blue-50 border-blue-200/80 text-blue-700",
  },
];

export function AgentPipelineVisual() {
  return (
    <div className="w-full max-w-4xl mx-auto text-left relative">
      {/* Central Guide Line (Desktop) */}
      <div className="absolute top-8 bottom-8 left-8 -translate-x-1/2 w-[2px] bg-stone-300/70 pointer-events-none hidden sm:block" />

      <div className="space-y-8 relative">
        {/* Phase 1 - 3 */}
        {AGENTS.map((agent) => (
          <AgentNode key={agent.step} agent={agent} />
        ))}

        {/* Phase 4 & 5 - Parallel Fan-Out Block */}
        <div className="sm:pl-16 relative">
          <div className="p-1 sm:p-2 rounded-2xl bg-orange-500/[0.04] border border-accent/20">
            <div className="px-4 py-2 flex items-center justify-between border-b border-accent/10 text-xs font-mono text-accent">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Parallel Multimodal Fan-Out (Simultaneous Video & Audio Inspection)
              </span>
              <span className="hidden md:inline px-2 py-0.5 rounded bg-white text-[10px] border border-accent/20">
                Gemini 3.8 Flash
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
              {PARALLEL_AGENTS.map((agent) => {
                const Icon = agent.icon;
                return (
                  <div
                    key={agent.step}
                    className="cozy-card p-5 rounded-xl flex flex-col justify-between space-y-3 bg-white"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-sm ${agent.iconBg}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary px-2 py-0.5 rounded bg-stone-100 border border-stone-200/60">
                          {agent.model}
                        </span>
                      </div>

                    <div className="pt-1">
                      <div className="text-xs font-mono text-accent font-semibold">
                        Agent {agent.step}
                      </div>
                      <h4 className="font-heading text-base font-bold text-text-primary">
                        {agent.name}
                      </h4>
                      <p className="text-[11px] font-mono text-text-tertiary">
                        {agent.role}
                      </p>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed font-sans">
                      {agent.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-800/[0.05]">
                    <div className="text-[10px] font-mono text-text-tertiary pb-1 font-semibold uppercase">
                      Callable Tools
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200/50"
                        >
                          {t}()
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Debate Loop Indicator */}
        <div className="sm:pl-16 py-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-50/80 border border-red-200/80 text-danger text-xs font-mono">
            <Repeat className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="font-semibold">
              Adversarial Verification Gate:
            </span>
            <span>
              If Critic rejects hypothesis, Supervisor orders re-investigation pass
            </span>
          </div>
        </div>

        {/* Phase 6 - 8 */}
        {POST_DEBATE_AGENTS.map((agent) => (
          <AgentNode key={agent.step} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentNode({ agent }: { agent: AgentStep }) {
  const Icon = agent.icon;
  return (
    <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 sm:pl-16 group">
      {/* Node Marker on line */}
      <div className="hidden sm:flex absolute left-8 -translate-x-1/2 top-6 w-5 h-5 rounded-full bg-white border-2 border-accent items-center justify-center z-10 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-accent" />
      </div>

      {/* Content Card */}
      <div className="cozy-card cozy-card-hover p-6 rounded-2xl w-full flex flex-col justify-between space-y-4 text-left">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm ${agent.iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono text-accent font-semibold">
                  Agent {agent.step}
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {agent.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-text-tertiary px-2.5 py-0.5 rounded bg-stone-100 border border-stone-200/60">
                {agent.model}
              </span>
            </div>
          </div>

          <p className="text-xs font-mono text-text-tertiary font-medium">
            {agent.role}
          </p>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
            {agent.description}
          </p>
        </div>

        {/* Tools */}
        <div className="pt-3 border-t border-stone-800/[0.05]">
          <div className="text-[10px] font-mono text-text-tertiary pb-1.5 font-semibold uppercase tracking-wider">
            Autonomous Tools & Execution Functions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.map((tool) => (
              <span
                key={tool}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] text-text-secondary border border-stone-200"
              >
                {tool}()
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentPipelineVisual;
