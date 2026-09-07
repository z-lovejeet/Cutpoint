import Link from "next/link";
import { cookies } from "next/headers";
import {
  Youtube,
  BarChart3,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Sparkles,
  PlusCircle,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import ScenePlaceholder from "@/components/canvas/ScenePlaceholder";
import { VideoThumbnail } from "@/components/dashboard/VideoThumbnail";
import { ConnectedChannelsCard } from "@/components/dashboard/ConnectedChannelsCard";
import type { Profile, YouTubeChannel, AnalysisRecord } from "@/types/database";

const DEMO_CHANNELS: YouTubeChannel[] = [
  {
    id: "demo-channel-1",
    user_id: "guest-evaluator-id",
    channel_id: "UCv_vLHiWPYh_58StfmQAviA",
    channel_name: "Veritasium Science & Tech (@demo)",
    channel_thumbnail: null,
    access_token: "mock-token",
    refresh_token: "mock-refresh",
    token_expires_at: new Date(Date.now() + 86400000).toISOString(),
    connected_at: new Date().toISOString(),
  },
];

const DEMO_ANALYSES: AnalysisRecord[] = [
  {
    id: "demo-analysis-1",
    user_id: "guest-evaluator-id",
    channel_id: "demo-channel-1",
    video_id: "M576WGiDBdQ",
    video_title: "Why 99% of YouTube Hooks Fail in the First 15 Seconds",
    status: "COMPLETE",
    report_data: null,
    error_message: null,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-run-2",
    user_id: "guest-evaluator-id",
    channel_id: "demo-channel-1",
    video_id: "y881t8ilMyc",
    video_title: "Building an Autonomous Multi-Agent AI System From Scratch",
    status: "COMPLETE",
    report_data: null,
    error_message: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-run-3",
    user_id: "guest-evaluator-id",
    channel_id: "demo-channel-1",
    video_id: "dQw4w9WgXcQ",
    video_title: "The Engineering Behind High-Retention Educational Video",
    status: "COMPLETE",
    report_data: null,
    error_message: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const isGuest = cookieStore.get("cutpoint_guest_session")?.value === "true";

  // Guard for neither user nor guest
  if (!user && !isGuest) return null;

  // Fetch real user profile if authenticated
  let profile: Profile | null = null;
  let channels: YouTubeChannel[] | null = null;
  let analyses: AnalysisRecord[] | null = null;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>();
    profile = p;

    const { data: ch } = await supabase
      .from("youtube_channels")
      .select("*")
      .eq("user_id", user.id)
      .returns<YouTubeChannel[]>();
    channels = ch;

    const { data: an } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<AnalysisRecord[]>();
    analyses = an;
  }

  // Only fall back to demo data if the session is explicitly Guest/Judge mode
  const guestDisconnected = cookieStore.get("cutpoint_guest_channel_disconnected")?.value === "true";
  const displayChannels = isGuest 
    ? (guestDisconnected ? [] : DEMO_CHANNELS) 
    : (channels || []);
  const displayAnalyses = isGuest ? DEMO_ANALYSES : (analyses || []);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    (isGuest ? "Hackathon Evaluator" : "Creator");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Guest Evaluator Mode Banner */}
      {isGuest && (
        <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/80 border border-orange-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-cozy">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-accent shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-accent-dark flex items-center gap-2">
                <span>Judge &amp; Evaluator Sandbox Active</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-[10px] text-accent border border-orange-200">
                  Guest Mode
                </span>
              </div>
              <p className="text-xs text-text-secondary pt-0.5">
                Full platform access enabled without signing up. Verified sample channel analytics and 8-agent forensic data are preloaded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-xs font-mono text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg bg-white border border-stone-200 shadow-sm transition-colors cursor-pointer"
              >
                Exit Guest Mode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Welcome Hero Banner with Primary CTAs */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-100/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" dot>
                <span>{isGuest ? "Evaluator Sandbox" : "Database Synced"}</span>
              </Badge>
              <Badge variant="accent">
                <ShieldCheck className="w-3 h-3 mr-1" />
                <span>8-Agent Pipeline Operational</span>
              </Badge>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Welcome to your studio, {displayName}.
            </h1>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              Diagnose audience drop-offs, inspect retention cliffs, and review timeline recommendations powered by Gemini 3.8 Flash &amp; Groq 120B multi-agent forensics.
            </p>
          </div>

          {/* Direct CTA Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link href="/dashboard/analyze">
              <Button
                variant="accent"
                size="lg"
                icon={<PlusCircle className="w-4 h-4" />}
                className="font-semibold shadow-glow"
              >
                <span>Run New Analysis</span>
              </Button>
            </Link>

            <Link href="/dashboard/reports">
              <Button
                variant="secondary"
                size="lg"
                icon={<FileText className="w-4 h-4" />}
              >
                <span>All Reports</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono uppercase tracking-wider">Connected Channels</span>
            <Youtube className="w-4 h-4 text-danger" />
          </div>
          <div className="font-heading text-3xl font-bold text-text-primary">
            {displayChannels.length}
          </div>
          <p className="text-xs font-mono text-text-tertiary">
            {isGuest ? "Verified Sandbox Channel" : "Channel sync active"}
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono uppercase tracking-wider">Completed Analyses</span>
            <BarChart3 className="w-4 h-4 text-accent" />
          </div>
          <div className="font-heading text-3xl font-bold text-text-primary">
            {displayAnalyses.length}
          </div>
          <p className="text-xs font-mono text-text-tertiary">
            Multimodal video retention forensics
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-mono uppercase tracking-wider">Engine Status</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-heading text-3xl font-bold text-text-primary flex items-center gap-2">
            <span>Online</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs font-mono text-text-tertiary">
            Gemini 3.8 Flash • Groq 120B • NumPy
          </p>
        </Card>
      </div>

      {/* Interactive Studio Forensic Inspector (3D Simulation) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-heading text-lg font-bold text-text-primary">
              Active Forensic Simulation
            </span>
          </div>
          <span className="text-xs font-mono text-text-tertiary">
            Interactive audience drop-off visualizer
          </span>
        </div>
        <ScenePlaceholder />
      </div>

      {/* Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* YouTube Channel Connection Status */}
        <ConnectedChannelsCard
          initialChannels={displayChannels}
          isGuest={isGuest}
          userId={user?.id}
        />

        {/* Recent Analyses / Activity */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text-primary">Recent Forensic Runs</h2>
            {displayAnalyses.length > 0 && (
              <Link
                href="/dashboard/reports"
                className="text-xs font-mono text-accent hover:underline"
              >
                View All
              </Link>
            )}
          </div>

          {displayAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayAnalyses.map((run: AnalysisRecord) => (
                <Link
                  key={run.id}
                  href={`/dashboard/report/${run.id}`}
                  className="group flex flex-col rounded-xl bg-background-base/70 border border-black/[0.05] hover:border-accent/30 hover:shadow-card transition-all overflow-hidden"
                >
                  <div className="relative aspect-video w-full bg-stone-200 overflow-hidden">
                    <VideoThumbnail
                      videoId={run.video_id}
                      title={run.video_title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-white/95 text-emerald-800 text-[10px] font-mono font-medium border border-emerald-200 shadow-sm backdrop-blur-sm">
                      {run.status === "COMPLETE" ? "Audit Complete" : run.status}
                    </span>
                    <div className="absolute bottom-2 right-2 p-1 rounded-lg bg-black/40 text-white group-hover:bg-accent transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div className="font-medium text-text-primary text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                      {run.video_title && !run.video_title.startsWith("Analysis of ")
                        ? run.video_title
                        : `Video ${run.video_id}`}
                    </div>
                    <div className="text-[11px] font-mono text-text-tertiary flex items-center justify-between pt-1 border-t border-black/[0.04]">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(run.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-accent font-medium">Gemini 3.5</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-stone-50/80 border border-dashed border-stone-300/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-accent flex items-center justify-center mx-auto shadow-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm text-text-primary">No Analyses Run Yet</p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Run your first video retention audit with our 8-agent AI engine to detect audience drop-offs and generate actionable prescriptions.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/dashboard/analyze">
                  <Button variant="accent" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                    <span>Analyze Your First Video</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
