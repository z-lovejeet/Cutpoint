"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Search,
  Unlink,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { toast } from "@/components/ui/Toaster";
import { VideoSelector } from "@/components/dashboard/VideoSelector";
import { AnalysisStepper } from "@/components/dashboard/AnalysisStepper";
import {
  getVideos,
  startAnalysis,
  getAnalysisStatus,
  disconnectYouTube,
  restoreGuestChannel,
} from "@/lib/api";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { useCutpointStore } from "@/lib/store";
import type { VideoListItem } from "@/types/database";

export default function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryVideoId = searchParams.get("video_id");

  const [videos, setVideos] = React.useState<VideoListItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = React.useState<string | null>(
    queryVideoId || null
  );
  const [manualVideoId, setManualVideoId] = React.useState<string>(
    queryVideoId || ""
  );
  const [isLoadingVideos, setIsLoadingVideos] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [isGuest, setIsGuest] = React.useState(false);

  // Zustand Store sync
  const {
    activeAnalysisId,
    analysisStatus,
    setActiveAnalysis,
    updateStatus,
    clearAnalysis,
  } = useCutpointStore();

  const loadCatalog = React.useCallback(async () => {
    try {
      setIsLoadingVideos(true);
      const guestDetected =
        typeof document !== "undefined" &&
        document.cookie.includes("cutpoint_guest_session=true");
      setIsGuest(guestDetected);

      const data = await getVideos();
      setVideos(data);
      if (queryVideoId) {
        setSelectedVideoId(queryVideoId);
      } else {
        setSelectedVideoId((prev) => prev || (data.length > 0 ? data[0].video_id : null));
      }
    } catch (err) {
      console.error("Failed to load videos catalog:", err);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [queryVideoId]);

  // Load videos on mount
  React.useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Listen to cross-component channel update events
  React.useEffect(() => {
    const handleChannelUpdated = () => {
      loadCatalog();
    };
    window.addEventListener("cutpoint_channel_updated", handleChannelUpdated);
    return () => {
      window.removeEventListener("cutpoint_channel_updated", handleChannelUpdated);
    };
  }, [loadCatalog]);

  const handleDisconnectYouTube = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectYouTube();
      setVideos([]);
      setSelectedVideoId(null);
      toast.success("YouTube channel disconnected successfully");
    } catch (err) {
      console.error("Failed to disconnect YouTube:", err);
      toast.error(err instanceof Error ? err.message : "Failed to disconnect channel");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRestoreDemo = async () => {
    try {
      restoreGuestChannel();
      setIsLoadingVideos(true);
      const data = await getVideos();
      setVideos(data);
      if (data.length > 0) {
        setSelectedVideoId(data[0].video_id);
      }
      toast.success("Demo sandbox catalog restored");
    } catch (err) {
      console.error("Failed restoring demo catalog:", err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Polling loop for active analysis
  React.useEffect(() => {
    if (!activeAnalysisId) return;

    let isCancelled = false;
    let pollInterval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const current = await getAnalysisStatus(activeAnalysisId);
        if (isCancelled) return;
        updateStatus(current);

        if (current.status === "COMPLETE") {
          // Status updated to complete. Let AnalysisStepper present completion card with countdown & pause controls.
          return;
        }

        if (current.status === "ERROR") {
          toast.error(current.error_message || "Analysis failed");
          return;
        }

        // Schedule next poll
        pollInterval = setTimeout(poll, 1500);
      } catch (err) {
        console.warn("Polling error:", err);
        if (!isCancelled) {
          pollInterval = setTimeout(poll, 2500);
        }
      }
    };

    poll();

    return () => {
      isCancelled = true;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [activeAnalysisId, router, updateStatus]);

  // Handle Start Analysis
  const handleStartAnalysis = async () => {
    const rawTarget = (manualVideoId || selectedVideoId || "").trim();
    if (!rawTarget) {
      toast.error("Please select a video or enter a YouTube Video ID");
      return;
    }

    const cleanVideoId = extractYouTubeVideoId(rawTarget);
    if (!cleanVideoId) {
      toast.error("Invalid YouTube URL or ID. Please provide an 11-character video ID or valid link.");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.info(`Initializing 8-agent retention forensics for ${cleanVideoId}...`);
      const res = await startAnalysis(cleanVideoId);

      setActiveAnalysis(res.analysis_id);
      updateStatus({
        analysis_id: res.analysis_id,
        status: "PENDING",
        progress_percentage: 5,
        current_phase: "Ingesting retention data...",
        active_agents: ["Data Ingestion Agent"],
        debate_rounds: 0,
        error_message: null,
      });
    } catch (err: unknown) {
      console.error("Start analysis error:", err);
      const msg = err instanceof Error ? err.message : "Failed to start analysis";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setManualVideoId(videoId);
  };

  const handleReset = () => {
    clearAnalysis();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      <LoadingScreen
        isLoading={isSubmitting}
        label="Initializing Retention Analysis..."
        sublabel="Dispatching Supervisor Agent & Data Ingestion..."
      />

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {activeAnalysisId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs font-mono text-text-tertiary hover:text-text-primary"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>New Search</span>
          </Button>
        )}
      </div>

      {/* Main Content: Stepper or Video Selector */}
      {activeAnalysisId && analysisStatus ? (
        <AnalysisStepper
          status={analysisStatus}
          onComplete={(id) => router.push(`/dashboard/report/${id}`)}
        />
      ) : (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-100/30 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="accent" dot>
                  <span>Multimodal Pipeline</span>
                </Badge>
                <Badge variant="neutral">
                  <span>Gemini 3.8 Flash + Groq 120B</span>
                </Badge>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                Run Retention Forensic Audit
              </h1>
              <p className="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed">
                Select an uploaded video from your channel, or enter any YouTube Video ID to run our 8-agent retention investigation ensemble.
              </p>
            </div>
          </div>

          {/* Direct Video ID Input Bar */}
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                  Enter YouTube Video ID or URL
                </h2>
                <p className="text-xs text-text-secondary pt-0.5">
                  Paste any public YouTube Video ID (e.g., <code className="font-mono text-accent">dQw4w9WgXcQ</code>)
                </p>
              </div>
              <Badge variant="neutral" className="hidden sm:inline-flex">
                <span>Instant Ingestion</span>
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  value={manualVideoId}
                  onChange={(e) => {
                    setManualVideoId(e.target.value);
                    setSelectedVideoId(e.target.value.trim());
                  }}
                  placeholder="Paste YouTube ID (e.g. dQw4w9WgXcQ) or URL..."
                  className="pl-10 font-mono text-sm bg-neutral-50/50"
                />
              </div>

              <Button
                variant="accent"
                size="md"
                onClick={handleStartAnalysis}
                isLoading={isSubmitting}
                disabled={!manualVideoId && !selectedVideoId}
                icon={<Sparkles className="w-4 h-4" />}
                className="shrink-0 font-semibold"
              >
                <span>Run Forensic Analysis</span>
              </Button>
            </div>
          </Card>

          {/* Video Library Catalog */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-heading text-lg font-bold text-text-primary">
                  {isGuest
                    ? "Evaluator Sandbox Catalog"
                    : videos.length > 0
                    ? "Channel Video Catalog"
                    : "Channel Uploads"}
                </h2>
                <p className="text-xs text-text-tertiary">
                  {isGuest
                    ? "Verified benchmark retention curves pre-loaded for hackathon evaluation"
                    : videos.length > 0
                    ? "Recent video uploads from your connected YouTube channel"
                    : "Connect your YouTube channel to import uploads, or enter any video ID above"}
                </p>
              </div>
              {videos.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-tertiary">
                    {videos.length} {videos.length === 1 ? "video" : "videos"} available
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnectYouTube}
                    isLoading={isDisconnecting}
                    icon={<Unlink className="w-3.5 h-3.5 text-stone-400 group-hover:text-danger" />}
                    className="text-xs font-mono text-stone-500 hover:text-danger hover:bg-red-50 border border-stone-200/80"
                    title="Disconnect YouTube channel"
                  >
                    <span>Disconnect</span>
                  </Button>
                </div>
              )}
            </div>

            <VideoSelector
              videos={videos}
              selectedVideoId={selectedVideoId}
              onSelect={handleSelectVideo}
              isLoading={isLoadingVideos}
              onRestoreDemo={isGuest ? handleRestoreDemo : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
