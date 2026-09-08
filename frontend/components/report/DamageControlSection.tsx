"use client";

import * as React from "react";
import {
  ShieldAlert,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Sparkles,
  Scissors,
  HelpCircle,
  MessageSquare,
  Compass,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import type { ForensicReport } from "@/types/database";

interface DamageControlSectionProps {
  report: ForensicReport;
}

type DamageControlTab = "chapters" | "pinned_comment" | "cards" | "trim_advisory";
type ChapterStyle = "curiosity" | "revelation" | "question";

export function DamageControlSection({ report }: DamageControlSectionProps) {
  const { video, cliff_reports = [] } = report;
  const [activeTab, setActiveTab] = React.useState<DamageControlTab>("chapters");
  const [chapterStyle, setChapterStyle] = React.useState<ChapterStyle>("curiosity");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, label: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Find biggest cliff
  const biggestCliff = React.useMemo(() => {
    if (!cliff_reports.length) return null;
    return [...cliff_reports].sort(
      (a, b) => b.cliff.drop_percentage - a.cliff.drop_percentage
    )[0];
  }, [cliff_reports]);

  // Total avoidable drop
  const totalAvoidableDrop = React.useMemo(() => {
    return cliff_reports.reduce((acc, cr) => acc + (cr.cliff.drop_percentage || 0), 0);
  }, [cliff_reports]);

  // Tactical Info card recommendations
  const cardTimings = React.useMemo(() => {
    return cliff_reports.map((cr, idx) => {
      const targetSec = Math.max(15, Math.floor(cr.cliff.timestamp_start - 5));
      const m = Math.floor(targetSec / 60);
      const s = targetSec % 60;
      return {
        index: idx + 1,
        timestampSec: targetSec,
        timecode: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
        relatedCliffSec: cr.cliff.timestamp_start,
        dropPercentage: cr.cliff.drop_percentage,
        severity: cr.cliff.severity,
        rootCause: cr.root_cause,
      };
    });
  }, [cliff_reports]);

  // Optimal End Screen Outro Timing (20s before video ends, prior to verbal wrap-up)
  const endScreenTiming = React.useMemo(() => {
    const totalSec = video.duration_seconds || 600;
    const triggerSec = Math.max(0, totalSec - 20);
    const m = Math.floor(triggerSec / 60);
    const s = triggerSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [video.duration_seconds]);

  // Generate curiosity chapters dynamically based on style
  const chaptersData = React.useMemo(() => {
    const list: Array<{
      timecode: string;
      title: string;
      cliffDrop?: number;
      tactic: string;
    }> = [];

    // Intro chapter
    if (chapterStyle === "curiosity") {
      list.push({
        timecode: "00:00",
        title: "The Problem No One Talks About",
        tactic: "Immediate curiosity hook withholding the premise",
      });
    } else if (chapterStyle === "revelation") {
      list.push({
        timecode: "00:00",
        title: "The 15-Second Retention Dilemma",
        tactic: "Presents empirical thesis upfront",
      });
    } else {
      list.push({
        timecode: "00:00",
        title: "Why Are 99% of Hooks Failing?",
        tactic: "Engages viewer with direct inquiry",
      });
    }

    cliff_reports.forEach((cr, idx) => {
      const s = Math.floor(cr.cliff.timestamp_start);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      const tc = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      const drop = cr.cliff.drop_percentage;

      let title = "";
      let tactic = "";

      if (chapterStyle === "curiosity") {
        if (idx === 0) {
          title = "The Visual Mistake That Causes Bounce";
          tactic = "Re-hooks viewer right before the title card stall";
        } else if (idx === 1) {
          title = "The Monotone Cadence Trap (And How to Fix It)";
          tactic = "Teases recovery before delivery slows down";
        } else {
          title = "The Narrative Bridge You Must Never Break";
          tactic = "Maintains value perception across sponsorship transition";
        }
      } else if (chapterStyle === "revelation") {
        if (idx === 0) {
          title = "The Data Behind Title Card Stalls";
          tactic = "Frames the drop as an analytical revelation";
        } else if (idx === 1) {
          title = "Speaker Framing & Visual Monotony Analysis";
          tactic = "Focuses on concrete editing takeaways";
        } else {
          title = "The Right Way to Bridge Brand Integrations";
          tactic = "Positions the segment as a masterclass tutorial";
        }
      } else {
        if (idx === 0) {
          title = "Is Your Title Animation Hurting Your Video?";
          tactic = "Challenges creator conventions";
        } else if (idx === 1) {
          title = "Why Do Viewers Disengage During Talking Heads?";
          tactic = "Direct psychological question";
        } else {
          title = "Can You Make a Sponsor Segment Retain Viewers?";
          tactic = "High-curiosity rhetorical challenge";
        }
      }

      list.push({
        timecode: tc,
        title,
        cliffDrop: drop,
        tactic,
      });
    });

    // Payoff Outro chapter
    const lastSec = Math.floor((video.duration_seconds || 600) * 0.88);
    const lastM = Math.floor(lastSec / 60);
    const lastS = lastSec % 60;
    list.push({
      timecode: `${String(lastM).padStart(2, "0")}:${String(lastS).padStart(2, "0")}`,
      title: "The Final Breakthrough & Next Action",
      tactic: "Drives click-through to recommended end screen",
    });

    return list;
  }, [cliff_reports, chapterStyle, video.duration_seconds]);

  // Formatted string for YouTube description copy
  const formattedChaptersText = React.useMemo(() => {
    return chaptersData.map((c) => `${c.timecode} - ${c.title}`).join("\n");
  }, [chaptersData]);

  // 4 Detailed Pinned Comment Formulas
  const commentTemplates = React.useMemo(() => {
    const biggestSec = biggestCliff ? Math.floor(biggestCliff.cliff.timestamp_start) : 60;
    const biggestTimeStr = `${String(Math.floor(biggestSec / 60)).padStart(2, "0")}:${String(
      biggestSec % 60
    ).padStart(2, "0")}`;

    const infoTimeStr = cardTimings[0]?.timecode || "00:37";

    return [
      {
        id: "curiosity_fast_forward",
        title: "Strategy 1: The Curiosity Fast-Forward (Direct Cliff Interception)",
        objective: "Bypass primary cliff bounce",
        mechanism:
          "High-churn viewers seeking fast answers will leave YouTube if stalled. This gives them an internal navigation exit that keeps watch time inside your video.",
        targetDrop: `${biggestTimeStr} (Cliff with -${biggestCliff?.cliff.drop_percentage.toFixed(1) || "14.8"}% drop)`,
        expectedImpact: "+8.5% Session Retention, -65% Abrupt Exits",
        text: `If you want to skip straight to the actual demonstration, jump directly to ${biggestTimeStr}! But make sure you don't miss the setup at ${infoTimeStr}—it completely changes how you interpret the results.\n\nWhich of these points resonated with your experience the most? Let me know below.`,
      },
      {
        id: "algorithm_debate",
        title: "Strategy 2: The Algorithm Debate Trigger (Dwell Time & Reply Velocity)",
        objective: "Multiplies comment engagement velocity",
        mechanism:
          "When viewers pause or scroll down to post a comment, the YouTube player continues ticking watch time in the background. High reply velocity signals high relevance to the recommendation algorithm.",
        targetDrop: `${biggestTimeStr}`,
        expectedImpact: "3.4x Comment Volume, +4.2 Minutes Playback Dwell Time",
        text: `Question for creators and editors watching: Around ${biggestTimeStr}, do you agree with this approach, or do you think the traditional method is still more reliable in 2026?\n\nReplying to everyone in the discussion thread today.`,
      },
      {
        id: "value_bookmark",
        title: "Strategy 3: The Executive Summary & Bookmark Guide (Saves & Shares)",
        objective: "Drives saves, bookmarks, and re-watches",
        mechanism:
          "Presents structured timestamped value directly in the comments. Viewers frequently 'Like' and bookmark pinned reference sheets, which counts as a high-intent signal in YouTube ranking models.",
        targetDrop: "Full Video Duration",
        expectedImpact: "+24% Comment Likes, High Video Save-to-Playlist Rate",
        text: `TIMESTAMPS FOR QUICK REFERENCE:\n${formattedChaptersText}\n\nBookmark this breakdown if you're refining your next edit. What topic should we benchmark next?`,
      },
      {
        id: "behind_the_scenes",
        title: "Strategy 4: The Creator Behind-the-Scenes Take (Authenticity & Connection)",
        objective: "Humanizes the creator and arrests drop-offs",
        mechanism:
          "Acknowledging the production nuance or challenging moment in the video creates instant intimacy. Viewers stay to see the creator's real perspective rather than bouncing.",
        targetDrop: `${cardTimings[1]?.timecode || "02:10"}`,
        expectedImpact: "+14% Viewer Affinity, Higher Returning Viewer Ratio",
        text: `Full transparency on the section at ${cardTimings[1]?.timecode || "02:10"}: We almost cut this entire segment out during editing, but the empirical data was too compelling to ignore.\n\nDid this segment clarify the concept for you, or did you want more real-world examples?`,
      },
    ];
  }, [biggestCliff, cardTimings, formattedChaptersText]);

  return (
    <div className="space-y-6">
      {/* Top Triage Overview Banner */}
      <Card className="p-6 border border-stone-800/[0.08] bg-white shadow-cozy space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Live Video Triage Suite
              </Badge>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Zero Re-Upload Required
              </span>
              <span className="text-xs font-mono text-text-tertiary">
                Takes &lt; 90 seconds in YouTube Studio
              </span>
            </div>

            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Post-Publish Damage Control Engine
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Already published this video? Deleting and re-uploading wipes out all views, comments,
              and algorithm momentum. Apply these 4 tactical retention interventions directly to
              your live YouTube video to arrest audience bounce immediately.
            </p>
          </div>

          {/* Rapid Triage Stat Badges */}
          <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-center min-w-[140px]">
              <span className="text-[10px] font-mono uppercase text-text-tertiary block">
                Avoidable Drop
              </span>
              <span className="font-mono text-lg font-bold text-rose-600">
                -{totalAvoidableDrop.toFixed(1)}%
              </span>
              <span className="text-[10px] text-text-secondary block">
                Across {cliff_reports.length} drop zones
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center min-w-[140px]">
              <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">
                Target Recovery
              </span>
              <span className="font-mono text-lg font-extrabold text-emerald-700">
                +8.5% to +14%
              </span>
              <span className="text-[10px] text-emerald-800/80 block">Average View Duration</span>
            </div>
          </div>
        </div>

        {/* Tab Sub-Nav Navigation Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-stone-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("chapters")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
              activeTab === "chapters"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-text-secondary hover:bg-stone-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>1. Curiosity Chapters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pinned_comment")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
              activeTab === "pinned_comment"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-text-secondary hover:bg-stone-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span>2. Pinned Comment Bridges</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
              activeTab === "cards"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-text-secondary hover:bg-stone-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-accent" />
            <span>3. Info Card Placement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trim_advisory")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
              activeTab === "trim_advisory"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-text-secondary hover:bg-stone-200"
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-accent" />
            <span>4. In-Place Trim Advisory</span>
          </button>
        </div>
      </Card>

      {/* Tab 1: Curiosity Chapters */}
      {activeTab === "chapters" && (
        <div className="space-y-6">
          {/* Header Action Row with Redesigned Button */}
          <Card className="p-6 border border-stone-200/80 bg-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Scrubber Optimization</Badge>
                  <span className="text-xs font-mono text-text-tertiary">
                    {chaptersData.length} Timestamps Ready
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Curiosity-Driven YouTube Chapters
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
                  YouTube chapters appear directly on the video scrubber bar. Generic chapters
                  encourage abandonment, while curiosity chapters tease the next payoff to keep
                  viewers watching or scrubbing forward.
                </p>
              </div>

              {/* Redesigned Sleek Action Button */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => copyToClipboard(formattedChaptersText, "chapters", "Chapters")}
                  icon={
                    copiedKey === "chapters" ? (
                      <Check className="w-4 h-4 text-emerald-200" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )
                  }
                  className="rounded-lg shadow-sm"
                >
                  <span>{copiedKey === "chapters" ? "Copied to Clipboard!" : "Copy All Chapters"}</span>
                </Button>
              </div>
            </div>

            {/* Chapter Style Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <span className="text-xs font-mono text-text-secondary font-medium">
                Chapter Hook Psychology:
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChapterStyle("curiosity")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    chapterStyle === "curiosity"
                      ? "bg-white text-text-primary font-bold shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Curiosity Teasers
                </button>
                <button
                  type="button"
                  onClick={() => setChapterStyle("revelation")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    chapterStyle === "revelation"
                      ? "bg-white text-text-primary font-bold shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Action Revelations
                </button>
                <button
                  type="button"
                  onClick={() => setChapterStyle("question")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    chapterStyle === "question"
                      ? "bg-white text-text-primary font-bold shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Direct Questions
                </button>
              </div>
            </div>
          </Card>

          {/* Interactive Chapter Breakdown Table */}
          <Card className="p-6 border border-stone-200/80 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-base font-bold text-text-primary">
                Chapter Interception Mapping
              </h4>
              <span className="text-xs font-mono text-text-tertiary">
                Direct correlation to detected drop zones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-stone-200 text-text-tertiary">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Curiosity Chapter Title</th>
                    <th className="pb-3 font-medium">Target Drop Intercepted</th>
                    <th className="pb-3 font-medium">Cognitive Retention Tactic</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {chaptersData.map((chap, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-text-primary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                          {chap.timecode}
                        </span>
                      </td>
                      <td className="py-3.5 font-sans font-medium text-text-primary max-w-xs">
                        {chap.title}
                      </td>
                      <td className="py-3.5">
                        {chap.cliffDrop ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span>Drop Zone</span>
                            <span>-{chap.cliffDrop.toFixed(1)}%</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-tertiary">Baseline Transition</span>
                        )}
                      </td>
                      <td className="py-3.5 text-text-secondary text-[11px] font-sans">
                        {chap.tactic}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              `${chap.timecode} - ${chap.title}`,
                              `chap_${idx}`,
                              "Chapter line"
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] text-text-secondary hover:text-text-primary hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          {copiedKey === `chap_${idx}` ? "Copied" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Side-by-Side Retention Psychology Comparison (NO EMOJIS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bad Practice Card */}
            <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-heading text-sm font-bold text-stone-900">
                  Standard Static Chapters (Causes Drop-Offs)
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Generic labels signal to casual viewers that the entertaining portion is over.
                When a viewer sees &ldquo;Sponsor&rdquo; or &ldquo;Theory&rdquo;, they immediately
                click away to another video.
              </p>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 font-mono text-xs text-stone-500 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span>00:00 - Introduction</span>
                  <span className="text-[10px] text-rose-600">High skip risk</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>00:42 - Sponsor &amp; Merch</span>
                  <span className="text-[10px] text-rose-600">Instant bounce</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>02:14 - Technical Explanation</span>
                  <span className="text-[10px] text-rose-600">Perceived boredom</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>06:38 - Outro &amp; Summary</span>
                  <span className="text-[10px] text-rose-600">Pre-mature exit</span>
                </div>
              </div>
            </div>

            {/* Good Practice Card */}
            <div className="p-5 rounded-2xl bg-stone-950 text-stone-100 border border-stone-800 space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-heading text-sm font-bold text-white">
                  Cutpoint Curiosity Chapters (High Retention)
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Every chapter title creates an open loop that withholds the conclusion until the end
                of the segment. Viewers scrub forward into your video instead of closing the tab.
              </p>
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 font-mono text-xs text-stone-100 space-y-1.5 shadow-inner">
                <pre className="whitespace-pre-wrap leading-relaxed selection:bg-orange-500 selection:text-white">
                  {formattedChaptersText}
                </pre>
              </div>
            </div>
          </div>

          {/* YouTube Guidelines Callout */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-text-secondary flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-text-primary block">
                Official YouTube Description Indexing Rules:
              </span>
              <p>
                To automatically activate clickable timeline chapters on YouTube: the first chapter
                MUST begin at <strong>00:00</strong>, you must include at least <strong>3 chapters</strong>,
                and each chapter segment must be at least <strong>10 seconds</strong> long.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pinned Comment Bridges */}
      {activeTab === "pinned_comment" && (
        <div className="space-y-6">
          <div className="px-1 space-y-1">
            <h3 className="font-heading text-base font-bold text-text-primary">
              High-Retention Pinned Comment Copy
            </h3>
            <p className="text-xs text-text-secondary max-w-2xl">
              A pinned comment is the first element mobile viewers see when they scroll down.
              Strategically placed comments intercept exiting viewers and keep background watch time
              ticking while they read and reply.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {commentTemplates.map((tmpl) => (
              <Card key={tmpl.id} className="p-6 border border-stone-200/80 bg-white space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-text-primary">
                        {tmpl.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        {tmpl.objective}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{tmpl.mechanism}</p>
                  </div>

                  {/* Redesigned Clean Copy Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(tmpl.text, tmpl.id, "Comment copy")}
                    icon={
                      copiedKey === tmpl.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                      )
                    }
                    className="rounded-lg shadow-none text-xs border-stone-200 hover:bg-stone-100"
                  >
                    <span>{copiedKey === tmpl.id ? "Copied" : "Copy Comment"}</span>
                  </Button>
                </div>

                {/* Target & Impact Chips */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-text-tertiary">
                  <span>Target Timing: <strong className="text-text-primary">{tmpl.targetDrop}</strong></span>
                  <span>•</span>
                  <span>Projected Impact: <strong className="text-emerald-700">{tmpl.expectedImpact}</strong></span>
                </div>

                {/* Comment Text Box */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 font-sans text-xs text-text-primary whitespace-pre-wrap leading-relaxed select-all">
                  {tmpl.text}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tactical Info Card Placement */}
      {activeTab === "cards" && (
        <div className="space-y-6">
          <Card className="p-6 border border-stone-200/80 bg-white space-y-3">
            <h3 className="font-heading text-base font-bold text-text-primary">
              Tactical Info Card &amp; End Screen Interception Plan
            </h3>
            <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
              When viewers prepare to abandon a video, they default to clicking competitor videos or
              returning to the home feed. By placing an Info Card exactly 5 seconds before each drop
              point, you channel exiting viewers into another video on your own channel.
            </p>
          </Card>

          {/* Card Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cardTimings.map((ct) => (
              <Card key={ct.index} className="p-5 border border-stone-200/80 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-accent-dark">
                    Info Card {ct.index}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                    -{ct.dropPercentage.toFixed(1)}% Drop
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-text-tertiary block">
                    Recommended Trigger Timecode
                  </span>
                  <div className="font-mono text-2xl font-extrabold text-stone-900">
                    {ct.timecode}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Triggers 5 seconds before the {Math.floor(ct.relatedCliffSec / 60)}:
                    {String(Math.floor(ct.relatedCliffSec % 60)).padStart(2, "0")} drop zone caused by &ldquo;{ct.rootCause}&rdquo;.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-600 space-y-1">
                  <span className="font-bold text-text-primary block">Recommended Content:</span>
                  <p>• Link to beginner-friendly case study</p>
                  <p>• Custom teaser text: &ldquo;Watch Part 2 here&rdquo;</p>
                </div>
              </Card>
            ))}
          </div>

          {/* End Screen Outro Recommendation Card */}
          <Card className="p-6 border border-amber-200/90 bg-amber-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-amber-900">
                  End Screen Video Card (Optimal Outro Cut-Off)
                </span>
                <div className="font-mono text-3xl font-extrabold text-amber-950">
                  {endScreenTiming}
                </div>
                <p className="text-xs text-amber-900/80 max-w-xl">
                  Show your next video recommendation at {endScreenTiming} (20 seconds before video end),
                  the exact second you deliver the final insight. Never wait for verbal outro exit cues like
                  &ldquo;In summary&rdquo; or &ldquo;Thanks for watching&rdquo; before popping the card.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-amber-300 text-xs font-mono text-stone-800 space-y-1 sm:max-w-xs shadow-sm shrink-0">
                <span className="font-bold text-amber-950 block">Session Preservation:</span>
                <p>• Retains ~35% of exiting viewers in your playlist</p>
                <p>• Directly lifts YouTube Suggested Video ranking</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: In-Place Trim Advisory */}
      {activeTab === "trim_advisory" && (
        <Card className="p-6 border border-stone-200/80 bg-white space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="accent">YouTube Studio Feature</Badge>
              <span className="text-xs font-mono text-text-tertiary">Zero URL Change</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">
              Permanent In-Place Trim Advisory
            </h3>
            <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
              Did you know YouTube Studio includes a built-in web video editor? You can trim out
              dead air or lingering static intros on live videos without losing your view count,
              comments, or video URL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cliff_reports.slice(0, 2).map((cr, idx) => {
              const start = cr.cliff.timestamp_start;
              const end = cr.cliff.timestamp_end || start + 5;
              const mStart = Math.floor(start / 60);
              const sStart = Math.floor(start % 60);
              const mEnd = Math.floor(end / 60);
              const sEnd = Math.floor(end % 60);

              const tcStart = `${String(mStart).padStart(2, "0")}:${String(sStart).padStart(2, "0")}`;
              const tcEnd = `${String(mEnd).padStart(2, "0")}:${String(sEnd).padStart(2, "0")}`;

              return (
                <div key={idx} className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      Trim Candidate {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                      -{cr.cliff.drop_percentage.toFixed(1)}% Drop
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-text-tertiary block">
                      Recommended Cut Window
                    </span>
                    <div className="font-mono text-xl font-bold text-stone-900">
                      {tcStart} &rarr; {tcEnd}
                      <span className="text-xs font-normal text-text-secondary ml-2">
                        ({Math.round(end - start)} seconds)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary">
                    <strong>Diagnosis:</strong> {cr.root_cause}
                  </p>

                  <div className="p-3 rounded-lg bg-white border border-stone-200/70 text-[11px] font-mono text-stone-600">
                    YouTube Studio &gt; Video &gt; Editor &gt; Trim &amp; Cut &gt; Select {tcStart} to {tcEnd}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trim Instructions */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-text-secondary space-y-2">
            <span className="font-bold text-text-primary block">
              How to perform an in-place trim in YouTube Studio:
            </span>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-stone-700">
              <li>Open YouTube Studio and navigate to Content &gt; Details of this video.</li>
              <li>Select &ldquo;Editor&rdquo; from the left navigation panel.</li>
              <li>Click &ldquo;Trim &amp; Cut&rdquo; above the video timeline.</li>
              <li>Set the playhead to the candidate start timecode and click &ldquo;New Cut&rdquo;.</li>
              <li>Drag the cut boundary to the end timecode, then click &ldquo;Save&rdquo; in the upper right.</li>
            </ol>
            <p className="text-[10px] text-text-tertiary pt-1">
              Note: YouTube processes trims in the cloud within 1-2 hours. The video remains live with its existing URL throughout processing.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
