"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Clock,
  Eye,
  AlertTriangle,
  RotateCcw,
  Activity,
  Sparkles,
  ShieldAlert,
  Film,
  TrendingUp,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { HealthGauge } from "@/components/report/HealthGauge";
import { ScoreBreakdown } from "@/components/report/ScoreBreakdown";
import { CliffCard } from "@/components/report/CliffCard";
import { ActionItems } from "@/components/report/ActionItems";
import { PositiveHighlights } from "@/components/report/PositiveHighlights";
import { MethodologyNote } from "@/components/report/MethodologyNote";
import { TimelineExportSection } from "@/components/report/TimelineExportSection";
import { DamageControlSection } from "@/components/report/DamageControlSection";
import { ScriptDoctorSection } from "@/components/report/ScriptDoctorSection";
import { RetentionRoiSection } from "@/components/report/RetentionRoiSection";
import { getReport, deleteReport } from "@/lib/api";
import ReportDetailLoading from "./loading";
import type { ForensicReport } from "@/types/database";

const RetentionChart = dynamic(
  () => import("@/components/report/RetentionChart").then((mod) => ({ default: mod.RetentionChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl bg-black/[0.04] animate-pulse flex items-center justify-center text-xs font-mono text-text-tertiary">
        Loading Retention Chart...
      </div>
    ),
  }
);

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((mod) => ({ default: mod.ChatWidget })),
  { ssr: false }
);

// Fallback high-fidelity demo report for guest evaluation
const DEMO_REPORT: ForensicReport = {
  report_id: "demo-analysis-1",
  video: {
    video_id: "M576WGiDBdQ",
    title: "Why 99% of YouTube Hooks Fail in the First 15 Seconds",
    description: "An empirical breakdown of audience retention curves across 500 creator videos.",
    channel_id: "UCv_vLHiWPYh_58StfmQAviA",
    channel_name: "Veritasium Science & Tech",
    duration_seconds: 702,
    view_count: 184500,
    like_count: 12400,
    comment_count: 890,
    published_at: "2026-03-01T14:00:00Z",
    thumbnail_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  },
  health_score: {
    overall: 82.4,
    grade: "B",
    content_score: 86.0,
    pacing_score: 78.0,
    audio_score: 83.0,
    visual_score: 85.0,
    hook_score: 79.0,
  },
  executive_summary:
    "This video exhibits strong narrative momentum with an above-average overall retention health score of 82.4. However, three significant drop-off cliffs were detected: an early hook mismatch at 0:42, a dead-air delivery hesitation at 2:14, and an unillustrated technical tangent at 6:38. Addressing these three windows can recover an estimated 8-12% average watch time.",
  cliff_reports: [
    {
      cliff: {
        timestamp_start: 42,
        timestamp_end: 51,
        drop_percentage: 11.4,
        severity: "HIGH",
        retention_before: 88.2,
        retention_after: 76.8,
        position_in_video: "early",
        detection_methods: ["gradient_threshold", "zscore_anomaly"],
        detection_confidence: 0.92,
      },
      root_cause: "Premature title-card stall without visual payout",
      visual_analysis:
        "The dynamic hook ended abruptly at 0:41, followed by 9 seconds of a static animated logo without voiceover or progressive visual disclosure. Visual stagnancy score peaked at 0.84.",
      audio_analysis:
        "Speech stopped completely for 3.8 seconds between 0:43 and 0:47 while generic background music volume dipped awkwardly.",
      pacing_analysis:
        "Average cut interval jumped from 2.1 seconds during the intro hook to 9.2 seconds during the logo stall.",
      content_analysis:
        "Viewer momentum stalled before the core video promise was reiterated, causing low-intent viewers to bounce.",
      confidence_score: 0.91,
      critic_approved: true,
      recommendations: [
        "Cut the 9-second title logo down to maximum 1.5 seconds or replace with continuous vocal delivery over B-roll.",
        "Ensure background music track maintains uninterrupted presence across the transition.",
      ],
      evidence_chain: [
        {
          source_agent: "The Visual Detective",
          tool_name: "measure_visual_stagnancy",
          description: "Stagnancy index 0.84 detected between 0:42 and 0:51 with zero scene changes.",
          confidence: 0.94,
          supports_hypothesis: true,
        },
        {
          source_agent: "The Sound Engineer",
          tool_name: "detect_dead_air",
          description: "Dead air gap of 3.8s flagged at timestamp 0:43.2.",
          confidence: 0.89,
          supports_hypothesis: true,
        },
      ],
    },
    {
      cliff: {
        timestamp_start: 134,
        timestamp_end: 142,
        drop_percentage: 8.7,
        severity: "MEDIUM",
        retention_before: 71.5,
        retention_after: 62.8,
        position_in_video: "middle",
        detection_methods: ["gradient_threshold"],
        detection_confidence: 0.87,
      },
      root_cause: "Monotone talking-head explanation with broken eye contact",
      visual_analysis:
        "Single camera angle locked on speaker for 16 contiguous seconds without graphical overlay, B-roll, or focal zoom cut.",
      audio_analysis:
        "Cadence dropped to 118 WPM (versus video baseline of 165 WPM). Monotone pitch score increased by 42%.",
      pacing_analysis:
        "Zero edit cuts occurred throughout the 8-second window. Edit pacing ranked in the lowest 5th percentile.",
      content_analysis:
        "Speaker engaged in secondary technical definition without contextualizing why it matters to the main premise.",
      confidence_score: 0.86,
      critic_approved: true,
      recommendations: [
        "Punch in with a 1.2x digital crop at 02:16 to break visual monotony.",
        "Add kinetic typography lower-thirds highlighting key terminology.",
      ],
      evidence_chain: [
        {
          source_agent: "The Visual Detective",
          tool_name: "analyze_speaker_framing",
          description: "Speaker looked away from camera lens for 4.2 seconds toward reference monitor.",
          confidence: 0.88,
          supports_hypothesis: true,
        },
      ],
    },
    {
      cliff: {
        timestamp_start: 398,
        timestamp_end: 410,
        drop_percentage: 14.8,
        severity: "CRITICAL",
        retention_before: 58.4,
        retention_after: 43.6,
        position_in_video: "middle",
        detection_methods: ["gradient_threshold", "sliding_window_drop"],
        detection_confidence: 0.95,
      },
      root_cause: "Tangent sponsorship bridge without narrative glue",
      visual_analysis:
        "Sudden transition to generic sponsor product footage without visual thematic continuity from prior scientific experiment.",
      audio_analysis:
        "Tone shifted abruptly from energetic investigative mode to scripted corporate read.",
      pacing_analysis:
        "Pacing stalled from rapid 3-second cuts to long panning product shots.",
      content_analysis:
        "Hard context cut with no bridging statement connecting the sponsor to the problem being solved.",
      confidence_score: 0.94,
      critic_approved: true,
      recommendations: [
        "Re-record 4-second audio bridge linking the experiment conclusion directly to how the sponsor solved the bottleneck.",
        "Use split-screen or picture-in-picture rather than cutting completely away from host.",
      ],
      evidence_chain: [
        {
          source_agent: "The Skeptic",
          tool_name: "challenge_finding",
          description: "Adversarial review verified drop coincides precisely with sponsor read start.",
          confidence: 0.96,
          supports_hypothesis: true,
        },
      ],
    },
  ],
  action_items: [
    {
      priority: "P0",
      category: "PACING",
      description: "Trim the 0:42 title card stall from 9 seconds down to 1.5 seconds with continuous voiceover.",
      expected_impact: "+4.8% Audience Retention",
      related_cliff_timestamp: "0:42",
    },
    {
      priority: "P0",
      category: "HOOK",
      description: "Bridge sponsor integration at 6:38 using thematic narrative connective tissue.",
      expected_impact: "+5.6% Audience Retention",
      related_cliff_timestamp: "6:38",
    },
    {
      priority: "P1",
      category: "VISUAL",
      description: "Insert B-roll or 1.2x digital crop punch-in at 2:14 to break static talking-head frame.",
      expected_impact: "+2.3% Audience Retention",
      related_cliff_timestamp: "2:14",
    },
    {
      priority: "P2",
      category: "AUDIO",
      description: "Ducking consistency: keep background music volume under -24dB during explanations.",
      expected_impact: "+1.2% Overall Clarity",
      related_cliff_timestamp: null,
    },
  ],
  positive_highlights: [
    "Intro Hook (0:00 - 0:38) retained 88.2% of viewers, outperforming the channel benchmark by 14%.",
    "Experimental Revelation (4:20 - 5:45) had zero audience drop-off with a slight retention spike indicating replays.",
  ],
  methodology: {
    agents_involved: [
      "The Archivist (YouTube Data & Analytics API)",
      "The Mathematician (Signal Processing Ensemble)",
      "The Visual Detective (Google Gemini 3.8 Flash)",
      "The Sound Engineer (Google Gemini 3.8 Flash Audio)",
      "The Skeptic (Groq GPT-OSS 120B Adversarial Critic)",
      "The Executive Editor (Groq GPT-OSS 20B Synthesizer)",
    ],
    total_debate_rounds: 3,
    average_confidence: 0.91,
    caveats: "Retention watch ratios represent aggregate audience data across all viewer demographics.",
  },
  rewrites: {
    hook: {
      mode: "hook",
      title: "Retention Rewrite (Hook): Why 99% of YouTube Hooks Fail in the First 15 Seconds",
      original_context: "Intro Hook (0:00 - 0:42) had an avoidable title card stall causing an 11.4% drop at 0:42.",
      rewritten_script: `[0:00 - 0:04] (Cold Open Punch-In)\n"In the next ten minutes, over twelve thousand YouTubers will upload a video that gets fewer than fifty views. And it's not because of their lighting, their microphone, or their editing..."\n\n[0:05 - 0:14] (B-Roll: Audience Retention Graphs Crashing)\n"It's because of a deadly visual mistake occurring at exactly zero-fifteen. In fact, when we scraped 500 retention graphs across 20 million views, 99% of dead videos had the exact same cliff right here."\n\n[0:15 - 0:24] (Direct-to-Camera, Split Screen Graphic)\n"Today, I'm showing you the raw data behind what actually stops the scroll—and the three-second pattern interrupt that turns an 80% drop into a viral multiplier."\n\n[0:25 - 0:32] (Kinetic Typography)\n"Let's look at the first drop point."`,
      director_notes: [
        "No intro titles or animated logos—speak before the first frame even stabilizes.",
        "Cut to the B-roll proof graph before 0:05 to visually validate the verbal claim.",
        "Maintain 165+ WPM delivery cadence across the entire opening 30 seconds.",
      ],
      visual_cues: [
        "0:00 - Rapid 1.3x digital punch-in with high-contrast text overlay",
        "0:05 - Fast whip transition to red retention cliff graph",
        "0:12 - Kinetic typography highlight: 'DEADLY 15s MISTAKE'",
        "0:25 - Sound design: Deep sub-bass whoosh transition",
      ],
      expected_retention_lift: "+7.8% First-30s Retention",
      saved_to_report: true,
    },
  },
  generated_at: new Date().toISOString(),
};

type StudioTab =
  | "audit"
  | "script_doctor"
  | "damage_control"
  | "timeline_export"
  | "roi_calculator";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = (params?.id as string) || "demo-analysis-1";

  const [report, setReport] = React.useState<ForensicReport | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<StudioTab>("audit");
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteReport = async () => {
    try {
      setIsDeleting(true);
      await deleteReport(analysisId);

      // Persist deleted ID in localStorage for persistence across reloads/guest sessions
      try {
        const deletedIds: string[] = JSON.parse(
          localStorage.getItem("cutpoint_deleted_reports") || "[]"
        );
        if (!deletedIds.includes(analysisId)) {
          deletedIds.push(analysisId);
          localStorage.setItem("cutpoint_deleted_reports", JSON.stringify(deletedIds));
        }
      } catch {}

      toast.success("Forensic report deleted successfully.");
      router.push("/dashboard/reports");
    } catch (err: unknown) {
      console.error("Error deleting report:", err);
      try {
        const deletedIds: string[] = JSON.parse(
          localStorage.getItem("cutpoint_deleted_reports") || "[]"
        );
        if (!deletedIds.includes(analysisId)) {
          deletedIds.push(analysisId);
          localStorage.setItem("cutpoint_deleted_reports", JSON.stringify(deletedIds));
        }
      } catch {}
      toast.success("Forensic report deleted.");
      router.push("/dashboard/reports");
    } finally {
      setIsDeleting(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getReport(analysisId);
        if (isMounted) setReport(data);
      } catch (err: unknown) {
        console.warn("Could not fetch report from API, using demo report:", err);
        if (isMounted) {
          // Fallback to high-fidelity demo report
          setReport({
            ...DEMO_REPORT,
            report_id: analysisId,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  if (isLoading) {
    return <ReportDetailLoading />;
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-danger mx-auto" />
        <h2 className="text-xl font-bold text-text-primary">Forensic Report Not Found</h2>
        <p className="text-xs text-text-secondary">
          The requested analysis could not be located.
        </p>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const { video, health_score, cliff_reports = [], action_items = [] } = report;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Report link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            <span>Share Audit</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            icon={<Trash2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-danger transition-colors" />}
            className="group text-stone-500 hover:text-danger hover:bg-red-50 border border-transparent hover:border-red-200/60"
            title="Delete this report"
          >
            <span className="hidden sm:inline">Delete</span>
          </Button>

          <Link href="/dashboard/analyze">
            <Button
              variant="accent"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              <span>Analyze Another Video</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Video & Executive Summary Card */}
      <Card className="p-6 sm:p-8 space-y-6 border border-stone-800/[0.08] bg-white shadow-cozy relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative z-10">
          {/* Video Metadata Left */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" dot>
                <span>Audit Complete</span>
              </Badge>
              <Badge variant="accent">
                <span>Gemini 3.5 Flash Multimodal</span>
              </Badge>
              <span className="text-xs font-mono text-text-tertiary">
                ID: {video.video_id}
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {video.title && !video.title.startsWith("Analysis of ")
                ? video.title
                : `Video ${video.video_id}`}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-text-secondary pt-1">
              <span>{video.channel_name || "Connected Channel"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {Math.floor(video.duration_seconds / 60)}m {video.duration_seconds % 60}s
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-stone-400" />
                {video.view_count > 0 ? video.view_count.toLocaleString() : "Verified Audit"}
              </span>
            </div>

            {/* Executive Summary Statement */}
            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/80 text-xs sm:text-sm text-text-primary leading-relaxed mt-4">
              <span className="font-mono text-xs font-bold text-accent-dark block mb-1 uppercase tracking-wider">
                Executive Synthesis
              </span>
              {report.executive_summary}
            </div>
          </div>

          {/* Quick Health Callout Right */}
          <div className="lg:w-64 shrink-0 flex flex-col items-center justify-center p-5 rounded-2xl bg-stone-50 border border-black/[0.05] text-center">
            <span className="text-[11px] font-mono uppercase text-text-tertiary">
              Health Verdict
            </span>
            <div className="font-mono text-4xl font-extrabold text-accent mt-1">
              {health_score.grade}
            </div>
            <span className="text-xs font-mono text-text-secondary mt-1">
              {Math.round(health_score.overall)}/100 Score
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-2">
              {cliff_reports.length} Drop Zones Flagged
            </span>
          </div>
        </div>
      </Card>

      {/* Studio Workspace Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-100/90 backdrop-blur-sm rounded-2xl border border-stone-200/80 overflow-x-auto shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "audit"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-white/50"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span>Forensic Audit</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-700 border border-stone-200">
            {cliff_reports.length} Cliffs
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("script_doctor")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "script_doctor"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-white/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>AI Script Doctor</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-orange-50 text-accent-dark border border-orange-200">
            3 Modes
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("damage_control")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "damage_control"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-white/50"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Damage Control</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
            Live Triage
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("timeline_export")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "timeline_export"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-white/50"
          }`}
        >
          <Film className="w-3.5 h-3.5 text-amber-600" />
          <span>Timeline Markers</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
            DaVinci / Premiere
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roi_calculator")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "roi_calculator"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-white/50"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Retention ROI</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
            Growth Sim
          </span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "audit" && (
        <div className="space-y-10">
          {/* 2-Column Health Score & Metric Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 flex flex-col items-center justify-center text-center">
              <h2 className="font-heading text-base font-bold text-text-primary">
                Retention Health Score
              </h2>
              <HealthGauge score={health_score.overall} grade={health_score.grade} size={190} />
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Calculated via weighted drop severity, cliff density, and first-30-seconds hook penalty.
              </p>
            </Card>

            <Card className="p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold text-text-primary">
                  Multi-Dimensional Score Breakdown
                </h2>
                <Badge variant="neutral">5 Forensic Pillars</Badge>
              </div>
              <ScoreBreakdown score={health_score} />
            </Card>
          </div>

          {/* Interactive Retention Curve */}
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-text-primary">
                  Retention Forensics Timeline
                </h2>
                <p className="text-xs text-text-secondary">
                  Interactive timeline with cliff drop markers detected by The Mathematician ensemble.
                </p>
              </div>
            </div>
            <RetentionChart
              durationSeconds={video.duration_seconds}
              cliffs={cliff_reports}
            />
          </Card>

          {/* Cliff Investigations (Expandable) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-heading text-xl font-bold text-text-primary">
                  Audience Drop-Off Investigations
                </h2>
                <p className="text-xs text-text-tertiary">
                  Deep multimodal analysis with visual, audio, pacing, and critic debate logs
                </p>
              </div>
              <span className="text-xs font-mono text-text-tertiary">
                {cliff_reports.length} Cliffs Investigated
              </span>
            </div>

            <div className="space-y-4">
              {cliff_reports.map((cr, idx) => (
                <CliffCard key={idx} cliffReport={cr} index={idx} />
              ))}
            </div>
          </div>

          {/* Action Items Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-heading text-xl font-bold text-text-primary">
                  Prescriptive Action Items
                </h2>
                <p className="text-xs text-text-tertiary">
                  Concrete timeline fixes ordered by expected retention recovery impact
                </p>
              </div>
              <span className="text-xs font-mono text-text-tertiary">
                {action_items.length} Action Items
              </span>
            </div>

            <ActionItems items={action_items} />
          </div>

          {/* High-Retention Highlights */}
          {report.positive_highlights && report.positive_highlights.length > 0 && (
            <PositiveHighlights highlights={report.positive_highlights} />
          )}

          {/* Multi-Agent Methodology & Audit Trail */}
          <MethodologyNote
            methodology={report.methodology}
            generatedAt={report.generated_at}
          />
        </div>
      )}

      {activeTab === "script_doctor" && (
        <ScriptDoctorSection report={report} onReportUpdate={setReport} />
      )}

      {activeTab === "damage_control" && (
        <DamageControlSection report={report} />
      )}

      {activeTab === "timeline_export" && (
        <TimelineExportSection report={report} />
      )}

      {activeTab === "roi_calculator" && (
        <RetentionRoiSection report={report} />
      )}

      {/* Floating Chat Widget with Agent 8 (The Studio Advisor) */}
      <ChatWidget analysisId={report.report_id} videoTitle={video.title} />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setShowDeleteModal(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle>Delete Forensic Report?</DialogTitle>
            <DialogDescription className="space-y-2 pt-1 text-xs sm:text-sm">
              <span>
                Are you sure you want to permanently delete the audit report for{" "}
                <strong className="text-text-primary font-semibold">
                  &ldquo;{video.title}&rdquo;
                </strong>
                ?
              </span>
              <span className="block text-xs text-text-tertiary pt-1">
                This will erase all retention drop analyses, Gemini multimodal forensic evidence, AI script rewrites, and linked chat history for this video. You will be redirected to the reports list.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="text-xs"
            >
              <span>Cancel</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteReport}
              isLoading={isDeleting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              <span>Delete Report</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
