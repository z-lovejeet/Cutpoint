import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Youtube, BarChart3, Clock, LogOut, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, YouTubeChannel, AnalysisRecord } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Fetch connected youtube channels
  const { data: channels } = await supabase
    .from("youtube_channels")
    .select("*")
    .eq("user_id", user.id)
    .returns<YouTubeChannel[]>();

  // Fetch recent analyses
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<AnalysisRecord[]>();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Creator";

  return (
    <div className="min-h-screen bg-background-base text-text-primary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <span className="font-heading text-lg font-bold text-white tracking-tight">Cutpoint</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full glass-card text-xs font-mono text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{user.email}</span>
            </div>

            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl glass-card border border-white/10 p-8 sm:p-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authenticated via Supabase • RLS Active</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              Welcome to your studio, {displayName}.
            </h1>
            <p className="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed">
              Connect your YouTube channel to diagnose retention cliffs, understand audience drop-off root causes, and query your videos via AI.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-text-tertiary">
              <span className="text-xs font-mono uppercase">Connected Channels</span>
              <Youtube className="w-4 h-4 text-danger" />
            </div>
            <div className="font-heading text-3xl font-bold text-white">
              {channels?.length || 0}
            </div>
            <p className="text-xs font-mono text-text-secondary">
              {channels?.length ? "Channel sync active" : "No channel connected"}
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-text-tertiary">
              <span className="text-xs font-mono uppercase">Completed Analyses</span>
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
            <div className="font-heading text-3xl font-bold text-white">
              {analyses?.length || 0}
            </div>
            <p className="text-xs font-mono text-text-secondary">
              Multimodal video forensics
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-text-tertiary">
              <span className="text-xs font-mono uppercase">System Status</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-heading text-3xl font-bold text-white">
              Online
            </div>
            <p className="text-xs font-mono text-text-secondary">
              Multi-Agent Orchestrator Ready
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Channel Connection Status */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-white">YouTube Channels</h2>
              <span className="text-xs font-mono text-accent">OAuth 2.0</span>
            </div>

            {channels && channels.length > 0 ? (
              <div className="space-y-3">
                {channels.map((ch: YouTubeChannel) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-background-elevated/70 border border-white/5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                        <Youtube className="w-5 h-5 text-danger" />
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{ch.channel_name}</div>
                        <div className="text-xs font-mono text-text-tertiary">{ch.channel_id}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-mono">
                      Connected
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-background-elevated/40 border border-dashed border-white/10 text-center space-y-4">
                <Youtube className="w-8 h-8 text-danger/80 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">No YouTube channel connected</p>
                  <p className="text-xs text-text-secondary">
                    Sign in with Google OAuth to automatically link your YouTube Studio analytics.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Analyses / Activity */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-white">Recent Forensic Runs</h2>
              <span className="text-xs font-mono text-text-tertiary">History</span>
            </div>

            {analyses && analyses.length > 0 ? (
              <div className="space-y-3">
                {analyses.map((run: AnalysisRecord) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-background-elevated/70 border border-white/5"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white text-sm">{run.video_title}</div>
                      <div className="text-xs font-mono text-text-tertiary flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(run.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link
                      href={`/report/${run.id}`}
                      className="p-2 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-background-elevated/40 border border-dashed border-white/10 text-center space-y-4">
                <BarChart3 className="w-8 h-8 text-primary/80 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">No analyses generated yet</p>
                  <p className="text-xs text-text-secondary">
                    Once your YouTube channel is connected, your first video analysis report will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
