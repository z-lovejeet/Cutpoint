"use client";

import * as React from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Flame,
  Terminal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Activity,
  ArrowRight,
  Pause,
  Play,
  Eye,
  Mic,
  Scale,
  FileCheck,
  Binary,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { AnalysisStatusResponse, AgentMessagePayload } from "@/types/database";

interface AnalysisStepperProps {
  status: AnalysisStatusResponse;
  onComplete?: (analysisId: string) => void;
}

interface StepDefinition {
  id: number;
  title: string;
  agent: string;
  agentRole: string;
  model: string;
  defaultDescription: string;
  minProgress: number;
  maxProgress: number;
  icon: LucideIcon;
}

const STEPS: StepDefinition[] = [
  {
    id: 1,
    title: "Audience Data Ingestion",
    agent: "The Archivist",
    agentRole: "Data Ingestion Agent",
    model: "YouTube Data & Analytics v2",
    defaultDescription: "Ingesting second-by-second audience watch ratios and validating data integrity.",
    minProgress: 0,
    maxProgress: 18,
    icon: Binary,
  },
  {
    id: 2,
    title: "Retention Cliff Detection",
    agent: "The Mathematician",
    agentRole: "Signal Processing Agent",
    model: "Calculus Gradient & Z-Score Ensemble",
    defaultDescription: "Running signal calculus and ensemble filtering to isolate critical gradient drops.",
    minProgress: 18,
    maxProgress: 35,
    icon: Layers,
  },
  {
    id: 3,
    title: "Multimodal Visual Forensics",
    agent: "The Visual Detective",
    agentRole: "Computer Vision Forensics",
    model: "Gemini 3.5 Flash Lite",
    defaultDescription: "Inspecting keyframes, pacing stagnancy, cut frequencies, and framing around cliffs.",
    minProgress: 35,
    maxProgress: 55,
    icon: Eye,
  },
  {
    id: 4,
    title: "Acoustic & Cadence Analysis",
    agent: "The Sound Engineer",
    agentRole: "Audio Spectrum Diagnostics",
    model: "Gemini 3.5 Flash Lite (Audio)",
    defaultDescription: "Detecting dead air silences, monotone speech patterns, and energy drops.",
    minProgress: 55,
    maxProgress: 72,
    icon: Mic,
  },
  {
    id: 5,
    title: "Adversarial Reflection & Debate",
    agent: "The Skeptic",
    agentRole: "Retention Critic Agent",
    model: "Groq GPT-OSS 120B",
    defaultDescription: "Cross-examining hypotheses, testing counter-explanations, and challenging weak evidence.",
    minProgress: 72,
    maxProgress: 88,
    icon: Scale,
  },
  {
    id: 6,
    title: "Executive Report Synthesis",
    agent: "The Executive Editor",
    agentRole: "Report Synthesizer Agent",
    model: "Groq GPT-OSS 20B",
    defaultDescription: "Computing 5-pillar health score and synthesizing timestamped actionable prescriptions.",
    minProgress: 88,
    maxProgress: 100,
    icon: FileCheck,
  },
];

export function AnalysisStepper({ status, onComplete }: AnalysisStepperProps) {
  const {
    progress_percentage,
    current_phase,
    active_agents = [],
    debate_rounds = 0,
    error_message,
    status: currentStatus,
    agent_messages = [],
    telemetry = {},
  } = status;

  const isComplete = currentStatus === "COMPLETE" || progress_percentage >= 100;
  const isError = currentStatus === "ERROR" || !!error_message;

  // Terminal state
  const [isTerminalOpen, setIsTerminalOpen] = React.useState(true);
  const [terminalFilter, setTerminalFilter] = React.useState<"all" | "findings" | "debates">("all");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  // Completion countdown state
  const [countdown, setCountdown] = React.useState(5);
  const [isPaused, setIsPaused] = React.useState(false);

  // Scroll terminal to bottom on new messages
  React.useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [agent_messages, autoScroll]);

  // Handle completion countdown
  React.useEffect(() => {
    if (!isComplete || !onComplete || isPaused) return;

    if (countdown <= 0) {
      onComplete(status.analysis_id);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete, onComplete, countdown, isPaused, status.analysis_id]);

  // Filter messages
  const filteredMessages = React.useMemo(() => {
    if (terminalFilter === "findings") {
      return agent_messages.filter((m) =>
        m.message_type?.toLowerCase().includes("finding") ||
        m.content?.toLowerCase().includes("isolated") ||
        m.content?.toLowerCase().includes("drop")
      );
    }
    if (terminalFilter === "debates") {
      return agent_messages.filter((m) =>
        m.sender?.includes("Skeptic") ||
        m.message_type?.toLowerCase().includes("challenge") ||
        m.content?.toLowerCase().includes("debate") ||
        m.content?.toLowerCase().includes("challenge")
      );
    }
    return agent_messages;
  }, [agent_messages, terminalFilter]);

  // Helper for agent badge styling in terminal
  const getAgentTag = (sender: string) => {
    switch (sender) {
      case "The Archivist":
        return { label: "ARCHIVIST", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
      case "The Mathematician":
        return { label: "MATHEMATICIAN", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      case "The Visual Detective":
        return { label: "VISUAL DETECTIVE", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
      case "The Sound Engineer":
        return { label: "SOUND ENGINEER", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      case "The Skeptic":
        return { label: "RETENTION CRITIC", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
      case "The Executive Editor":
        return { label: "EXECUTIVE EDITOR", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      case "Lead Investigator":
      case "Supervisor":
        return { label: "SUPERVISOR", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
      default:
        return { label: sender.toUpperCase(), color: "bg-stone-500/15 text-stone-300 border-stone-500/30" };
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("challenge")) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">CHALLENGE</span>;
    }
    if (t.includes("finding")) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">FINDING</span>;
    }
    if (t.includes("approval")) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">APPROVED</span>;
    }
    if (t.includes("plan") || t.includes("delegation")) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">DISPATCH</span>;
    }
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-700/40 text-stone-300 border border-stone-600/30">INFO</span>;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Completion Banner (When Complete) */}
      {isComplete && (
        <Card className="p-6 bg-gradient-to-r from-emerald-950/90 via-stone-900 to-stone-900 border-emerald-500/40 text-white shadow-xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-mono tracking-wider text-emerald-400 font-semibold uppercase">
                  Forensic Retention Audit Finalized
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                Multi-Agent Investigation Complete
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                All 8 autonomous agents have executed their passes, verified drop causality through adversarial critique, and compiled executive editing recommendations.
              </p>

              {/* Quick Summary Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                {telemetry.overall_score !== undefined && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Health Score: {telemetry.overall_score}/100 ({telemetry.grade || "B"})
                  </span>
                )}
                {telemetry.cliffs_count !== undefined && (
                  <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-200 border border-stone-700">
                    {telemetry.cliffs_count} Drop Cliffs Isolated
                  </span>
                )}
                {telemetry.action_items_count !== undefined && (
                  <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-200 border border-stone-700">
                    {telemetry.action_items_count} Action Items Ranked
                  </span>
                )}
              </div>
            </div>

            {/* Controlled Auto-Redirect Controls */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0 w-full sm:w-auto">
              <Button
                variant="accent"
                size="md"
                onClick={() => onComplete && onComplete(status.analysis_id)}
                icon={<ArrowRight className="w-4 h-4" />}
                className="font-semibold shadow-lg shadow-accent/20"
              >
                <span>View Forensic Report Now</span>
              </Button>

              <div className="flex items-center justify-between md:justify-end gap-2 px-1">
                <span className="text-[11px] font-mono text-stone-400">
                  {isPaused ? "Auto-redirect paused" : `Auto-opening in ${countdown}s`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors text-xs inline-flex items-center gap-1"
                  title={isPaused ? "Resume auto-redirect" : "Pause auto-redirect"}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-mono text-emerald-400">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" />
                      <span className="text-[10px] font-mono">Pause</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Progress Header Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-stone-800/[0.08] bg-white shadow-cozy relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Multi-Agent Runtime
              </span>
              <Badge variant={isError ? "danger" : isComplete ? "success" : "accent"} dot>
                {isError ? "Pipeline Errored" : isComplete ? "Forensic Audit Ready" : "Pipeline Active"}
              </Badge>
              <Badge variant="neutral" className="hidden sm:inline-flex">
                <Cpu className="w-3 h-3 mr-1 text-accent" />
                <span>8 Autonomous Agents</span>
              </Badge>
            </div>
            
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary mt-1">
              {isError
                ? "Forensic pipeline encountered an issue"
                : isComplete
                ? `Retention audit ready for ${telemetry.video_title ? `"${telemetry.video_title}"` : "video"}`
                : current_phase || "Analyzing audience retention..."}
            </h2>

            {telemetry.video_title && !isComplete && (
              <p className="text-xs text-text-secondary font-mono">
                Target: &ldquo;{telemetry.video_title}&rdquo; {telemetry.duration_seconds && `(${Math.floor(Number(telemetry.duration_seconds) / 60)}m ${Number(telemetry.duration_seconds) % 60}s)`}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="font-heading text-4xl sm:text-5xl font-bold text-accent tracking-tight">
                {progress_percentage}
              </span>
              <span className="text-lg font-mono text-text-tertiary font-medium">%</span>
            </div>
            <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
              {isComplete ? "Completed" : "Dynamic Telemetry"}
            </span>
          </div>
        </div>

        {/* Dynamic Smooth Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-3 rounded-full bg-stone-100 overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full relative ${
                isError
                  ? "bg-danger"
                  : isComplete
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-orange-400 via-accent to-accent-dark"
              }`}
              style={{ width: `${Math.min(100, Math.max(4, progress_percentage))}%` }}
            >
              {!isComplete && !isError && (
                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary px-1">
            <span>Stage 1: Ingestion & Signal Calculus</span>
            <span>Stage 2: Multimodal Forensics</span>
            <span>Stage 3: Skeptic Debate & Synthesis</span>
          </div>
        </div>

        {/* Live Blackboard Telemetry Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs font-mono text-text-secondary border-t border-black/[0.04]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-tertiary flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-accent" />
              Active Dispatch:
            </span>
            {active_agents.length > 0 ? (
              active_agents.map((ag) => (
                <span
                  key={ag}
                  className="px-2 py-0.5 rounded-md bg-stone-900/[0.05] text-text-primary border border-stone-200 font-medium"
                >
                  {ag}
                </span>
              ))
            ) : isComplete ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pipeline Finalized
              </span>
            ) : (
              <span className="text-text-tertiary">Pipeline Orchestrator</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {telemetry.cliffs_count !== undefined && (
              <span className="text-[11px] font-mono text-text-secondary bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                {telemetry.cliffs_count} Drops Isolated
              </span>
            )}

            {(debate_rounds > 0 || (telemetry.debate_rounds && Number(telemetry.debate_rounds) > 0)) && (
              <div className="flex items-center gap-1 text-accent-dark font-semibold">
                <Flame className="w-3.5 h-3.5 text-accent" />
                <span>{debate_rounds || telemetry.debate_rounds} Critic Debate Rounds</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Callout */}
        {isError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-danger flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Execution Error</p>
              <p className="mt-0.5 text-red-700">{error_message || "An unexpected error occurred during investigation."}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Real-time Multi-Agent Telemetry Stream / Console */}
      <div className="rounded-2xl border border-stone-800 bg-[#121214] text-stone-200 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#18181B] border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-3 w-px bg-stone-700" />
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-mono font-semibold text-stone-200">
                LIVE MULTI-AGENT TELEMETRY STREAM
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="hidden sm:flex items-center rounded-lg bg-stone-900 border border-stone-800 p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setTerminalFilter("all")}
                className={`px-2 py-0.5 rounded ${
                  terminalFilter === "all" ? "bg-stone-800 text-white font-medium" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                All ({agent_messages.length})
              </button>
              <button
                type="button"
                onClick={() => setTerminalFilter("findings")}
                className={`px-2 py-0.5 rounded ${
                  terminalFilter === "findings" ? "bg-stone-800 text-amber-400 font-medium" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Findings
              </button>
              <button
                type="button"
                onClick={() => setTerminalFilter("debates")}
                className={`px-2 py-0.5 rounded ${
                  terminalFilter === "debates" ? "bg-stone-800 text-rose-400 font-medium" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Debates
              </button>
            </div>

            {/* Toggle Terminal Collapse */}
            <button
              type="button"
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className="p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              title={isTerminalOpen ? "Collapse telemetry" : "Expand telemetry"}
            >
              {isTerminalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        {isTerminalOpen && (
          <div className="p-4 space-y-3 font-mono text-xs max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700">
            {filteredMessages.length === 0 ? (
              <div className="py-8 text-center text-stone-500 space-y-1">
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-stone-600 mb-2" />
                <p>Establishing telemetry bridge to multi-agent blackboard...</p>
                <p className="text-[11px] text-stone-600">Events and inter-agent dialogues will appear here live as they occur.</p>
              </div>
            ) : (
              filteredMessages.map((msg: AgentMessagePayload, idx: number) => {
                const tag = getAgentTag(msg.sender);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${tag.color}`}>
                          {tag.label}
                        </span>
                        <span className="text-stone-500">→</span>
                        <span className="text-stone-400 text-[10px]">
                          {msg.recipient}
                        </span>
                        {getMessageTypeBadge(msg.message_type || "info")}
                      </div>

                      <span className="text-stone-600 text-[10px]">
                        Event #{idx + 1}
                      </span>
                    </div>

                    <p className="text-stone-200 leading-relaxed pl-1 text-[11px]">
                      {msg.content}
                    </p>

                    {/* Metadata attributes if present */}
                    {msg.data && Object.keys(msg.data).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                        {msg.data.tools && Array.isArray(msg.data.tools) && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-stone-800 text-cyan-300 border border-cyan-800/40">
                            tools: {msg.data.tools.join(", ")}
                          </span>
                        )}
                        {msg.data.confidence && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-stone-800 text-emerald-300 border border-emerald-800/40">
                            confidence: {Math.round(Number(msg.data.confidence) * 100)}%
                          </span>
                        )}
                        {msg.data.cliffs_count && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-stone-800 text-amber-300 border border-amber-800/40">
                            cliffs: {msg.data.cliffs_count}
                          </span>
                        )}
                        {msg.data.overall_score && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-stone-800 text-purple-300 border border-purple-800/40">
                            score: {msg.data.overall_score}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* Terminal Footer Controls */}
        {isTerminalOpen && (
          <div className="flex items-center justify-between px-4 py-2 bg-[#151518] border-t border-stone-800/80 text-[10px] font-mono text-stone-500">
            <span>Buffer: {filteredMessages.length} events streamed</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-stone-300 transition-colors">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded bg-stone-800 border-stone-700 text-accent focus:ring-0 w-3 h-3"
                />
                <span>Auto-scroll</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Steps List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
            Agent Execution Pipeline
          </span>
          <span className="text-xs font-mono text-text-tertiary">
            {STEPS.filter((s) => progress_percentage >= s.maxProgress).length} of {STEPS.length} stages finalized
          </span>
        </div>

        {STEPS.map((step) => {
          const isStepCompleted = progress_percentage >= step.maxProgress;
          const isStepActive =
            !isStepCompleted && progress_percentage >= step.minProgress && !isError;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                isStepCompleted
                  ? "bg-emerald-50/20 border-emerald-200/80"
                  : isStepActive
                  ? "bg-white border-accent shadow-card ring-1 ring-accent/30"
                  : "bg-white/60 border-stone-800/[0.06] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Step status icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isStepCompleted
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : isStepActive
                        ? "bg-orange-100 text-accent border border-orange-200 shadow-sm"
                        : "bg-stone-100 text-stone-400 border border-stone-200/60"
                    }`}
                  >
                    {isStepCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isStepActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Step descriptions and real telemetry chips */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-text-primary">
                        {step.title}
                      </span>
                      <span className="text-[11px] font-mono text-accent-dark font-medium px-2 py-0.5 rounded-md bg-orange-100/60 border border-orange-200/60">
                        {step.agent}
                      </span>
                      <span className="text-[10px] font-mono text-text-tertiary">
                        ({step.agentRole})
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {step.defaultDescription}
                    </p>

                    {/* DYNAMIC TELEMETRY CHIPS PER STEP */}
                    {/* Step 1: Data Ingestion chips */}
                    {step.id === 1 && (isStepActive || isStepCompleted) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {telemetry.video_title && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-text-primary border border-stone-200">
                            📹 &ldquo;{telemetry.video_title}&rdquo;
                          </span>
                        )}
                        {telemetry.retention_points && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            📈 {telemetry.retention_points} retention coordinates ingested
                          </span>
                        )}
                        {telemetry.duration_seconds && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-text-secondary border border-stone-200">
                            ⏱️ Duration: {Math.floor(Number(telemetry.duration_seconds) / 60)}m {Number(telemetry.duration_seconds) % 60}s
                          </span>
                        )}
                      </div>
                    )}

                    {/* Step 2: Mathematician Cliff Detection chips */}
                    {step.id === 2 && (isStepActive || isStepCompleted) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {telemetry.cliffs && Array.isArray(telemetry.cliffs) && telemetry.cliffs.length > 0 ? (
                          telemetry.cliffs.map((chip: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                            >
                              🔻 Drop: {chip}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                            {isStepCompleted ? "Critical gradient drops isolated" : "Calculating derivative slopes..."}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Step 3: Visual Forensics chips */}
                    {step.id === 3 && (isStepActive || isStepCompleted) && (
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          🔧 Tools: inspect_keyframes
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          measure_visual_stagnancy
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          analyze_transitions
                        </span>
                      </div>
                    )}

                    {/* Step 4: Audio Cadence chips */}
                    {step.id === 4 && (isStepActive || isStepCompleted) && (
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          🎙️ Tools: detect_silences
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          analyze_speech_cadence
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          measure_audio_energy
                        </span>
                      </div>
                    )}

                    {/* Step 5: Retention Critic chips */}
                    {step.id === 5 && (isStepActive || isStepCompleted) && (
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-purple-600" />
                          {debate_rounds || telemetry.debate_rounds || 1} Debate Rounds
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-text-secondary border border-stone-200">
                          Cross-examination & hallucination check: PASS
                        </span>
                      </div>
                    )}

                    {/* Step 6: Executive Synthesis chips */}
                    {step.id === 6 && (isStepActive || isStepCompleted) && (
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                        {telemetry.overall_score !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                            🏆 Overall Health: {telemetry.overall_score}/100 ({telemetry.grade || "B"})
                          </span>
                        )}
                        {telemetry.action_items_count !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-text-primary border border-stone-200">
                            📋 {telemetry.action_items_count} Action Items Ranked
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Model badge */}
                <div className="shrink-0 hidden md:block">
                  <span className="text-[10px] font-mono text-text-tertiary px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 block text-right">
                    {step.model}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

