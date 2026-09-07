"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Youtube,
  Cpu,
  Copy,
  Check,
  Save,
  Radio,
  LogOut,
  Sliders,
  Unlink,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toaster";
import { createClient } from "@/lib/supabase/client";
import { disconnectYouTube, restoreGuestChannel, getYouTubeAuthUrl } from "@/lib/api";
import SettingsLoading from "./loading";
import type { Profile, YouTubeChannel } from "@/types/database";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copiedUid, setCopiedUid] = React.useState(false);
  const [isGuest, setIsGuest] = React.useState(false);

  // User & Profile State
  const [userId, setUserId] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [displayName, setDisplayName] = React.useState<string>("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [createdAt, setCreatedAt] = React.useState<string>("");
  const [channels, setChannels] = React.useState<YouTubeChannel[]>([]);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = React.useState<string | null>(null);

  // AI & Forensic Preferences State
  const [sensitivity, setSensitivity] = React.useState<"lenient" | "standard" | "strict">("standard");
  const [enableCriticLoop, setEnableCriticLoop] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      try {
        const supabase = createClient();

        // Check for guest evaluator session
        const guestSession =
          typeof document !== "undefined" &&
          document.cookie.includes("cutpoint_guest_session=true");
        setIsGuest(guestSession);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (!isMounted) return;
          setUserId(user.id);
          setEmail(user.email || "");
          setCreatedAt(user.created_at ? new Date(user.created_at).toLocaleDateString() : "Active");

          // Fetch profile row
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single<Profile>();

          if (prof) {
            setDisplayName(prof.display_name || user.user_metadata?.full_name || "");
            setAvatarUrl(prof.avatar_url || user.user_metadata?.avatar_url || null);
          } else {
            setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
            setAvatarUrl(user.user_metadata?.avatar_url || null);
          }

          // Fetch connected youtube channels
          const { data: chs } = await supabase
            .from("youtube_channels")
            .select("*")
            .eq("user_id", user.id)
            .returns<YouTubeChannel[]>();

          if (chs) {
            setChannels(chs);
          }
        } else if (guestSession) {
          if (!isMounted) return;
          setUserId("92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72");
          setEmail("evaluator@cutpoint.ai (Guest)");
          setDisplayName("Judge & Guest Evaluator");
          setCreatedAt(new Date().toLocaleDateString());

          const guestDisconnected =
            typeof document !== "undefined" &&
            document.cookie.includes("cutpoint_guest_channel_disconnected=true");

          if (guestDisconnected) {
            setChannels([]);
          } else {
            setChannels([
              {
                id: "demo-channel-1",
                user_id: "92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72",
                channel_id: "UCdemo_veritasium_clone",
                channel_name: "Veritasium Science & Tech (@demo)",
                channel_thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
                access_token: "demo-token",
                refresh_token: "demo-refresh",
                token_expires_at: new Date(Date.now() + 86400000).toISOString(),
                connected_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load settings user data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyUid = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedUid(true);
    toast.success("Account UID copied to clipboard");
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleDisconnectChannel = async (channelId?: string, channelName?: string) => {
    try {
      setDisconnectingId(channelId || "all");
      setConfirmDisconnectId(null);
      await disconnectYouTube(channelId);

      if (!isGuest && userId) {
        try {
          const supabase = createClient();
          let query = supabase.from("youtube_channels").delete().eq("user_id", userId);
          if (channelId) {
            query = query.or(`channel_id.eq.${channelId},id.eq.${channelId}`);
          }
          await query;
        } catch (err) {
          console.warn("Direct Supabase channel deletion error:", err);
        }
      }

      if (channelId) {
        setChannels((prev) => prev.filter((c) => c.channel_id !== channelId && c.id !== channelId));
      } else {
        setChannels([]);
      }

      toast.success(
        channelName
          ? `Channel "${channelName}" disconnected`
          : "YouTube channel disconnected successfully"
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to disconnect channel:", err);
      toast.error(err instanceof Error ? err.message : "Failed to disconnect channel");
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleRestoreDemo = () => {
    restoreGuestChannel();
    setChannels([
      {
        id: "demo-channel-1",
        user_id: "92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72",
        channel_id: "UCdemo_veritasium_clone",
        channel_name: "Veritasium Science & Tech (@demo)",
        channel_thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
        access_token: "demo-token",
        refresh_token: "demo-refresh",
        token_expires_at: new Date(Date.now() + 86400000).toISOString(),
        connected_at: new Date().toISOString(),
      },
    ]);
    toast.success("Demo sandbox channel restored");
    router.refresh();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      toast.info("Profile modifications are read-only in Guest Evaluator mode.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      toast.success("Profile details successfully updated!");
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/auth/sign-out", { method: "POST" });
      if (res.ok) {
        toast.success("Signed out successfully");
        router.push("/sign-in");
        router.refresh();
      } else {
        toast.error("Failed to sign out");
      }
    } catch {
      toast.error("Network error signing out");
    }
  };

  if (isLoading) {
    return <SettingsLoading />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Badge variant="accent">
            <Sliders className="w-3 h-3 mr-1" />
            <span>Studio Preferences</span>
          </Badge>
          {isGuest && (
            <Badge variant="warning" dot>
              <span>Guest Sandbox Mode</span>
            </Badge>
          )}
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          Account &amp; Studio Settings
        </h1>
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
          Manage your creator profile, YouTube Studio OAuth connections, and 8-agent AI forensic configuration.
        </p>
      </div>

      {/* Section 1: Creator Profile Details */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800/[0.06] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent flex items-center justify-center border border-orange-200/70 shadow-sm">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-text-primary">
                Creator Profile
              </h2>
              <p className="text-xs text-text-secondary">
                Public name and avatar displayed on forensic reports and team exports.
              </p>
            </div>
          </div>
          <Badge variant="success" dot>
            <span>Verified</span>
          </Badge>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar & Display Name */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar
              src={avatarUrl}
              fallback={displayName || "Creator"}
              size="lg"
              className="h-16 w-16 text-lg ring-4 ring-orange-50"
            />
            <div className="space-y-1 flex-1 w-full">
              <label className="block text-xs font-mono font-medium text-text-secondary">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Lovejeet Singh"
                required
                disabled={isLoading || isGuest}
                className="max-w-md font-medium"
              />
            </div>
          </div>

          {/* Email & Account ID Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-text-secondary">
                Registered Email
              </label>
              <Input
                value={email}
                disabled
                className="bg-stone-50 font-mono text-xs text-text-secondary"
              />
              <p className="text-[11px] text-text-tertiary">
                Managed securely via Supabase Auth.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-text-secondary">
                Account UID
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={userId}
                  disabled
                  className="bg-stone-50 font-mono text-xs text-text-secondary truncate"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyUid}
                  className="shrink-0"
                  title="Copy UID"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-text-tertiary">
                {createdAt ? `Account created: ${createdAt}` : "PostgreSQL database reference identifier."}
              </p>
            </div>
          </div>

          {/* Save Profile Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="accent"
              isLoading={isSaving}
              disabled={isLoading || isGuest}
              icon={<Save className="w-4 h-4" />}
            >
              <span>{isGuest ? "Read-only in Guest Mode" : "Save Profile Details"}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 2: Connected YouTube Channels */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800/[0.06] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-danger flex items-center justify-center border border-red-200/70 shadow-sm">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-text-primary">
                YouTube Studio Integration
              </h2>
              <p className="text-xs text-text-secondary">
                Sync audience retention graphs, video transcripts, and watch-time curves directly.
              </p>
            </div>
          </div>
          <Badge variant="primary">Google OAuth 2.0</Badge>
        </div>

        {/* Channels List */}
        <div className="space-y-3">
          {channels.length > 0 ? (
            channels.map((ch) => (
              <div
                key={ch.id || ch.channel_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background-base/70 border border-black/[0.05] gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-100/60 text-danger flex items-center justify-center shrink-0">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary text-sm truncate">
                      {ch.channel_name}
                    </div>
                    <div className="text-xs font-mono text-text-tertiary truncate">
                      Channel ID: {ch.channel_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Badge variant="success" dot>
                    <span>{isGuest ? "Demo Linked" : "Active & Synced"}</span>
                  </Badge>

                  {confirmDisconnectId === (ch.channel_id || ch.id) ? (
                    <div className="flex items-center gap-1.5 bg-red-50/80 p-1 rounded-lg border border-red-200">
                      <span className="text-[11px] font-mono text-danger pl-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Disconnect?
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="text-xs py-1 px-2 h-7 font-mono"
                        isLoading={disconnectingId === (ch.channel_id || ch.id)}
                        onClick={() => handleDisconnectChannel(ch.channel_id || ch.id, ch.channel_name)}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs py-1 px-2 h-7 font-mono"
                        onClick={() => setConfirmDisconnectId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDisconnectId(ch.channel_id || ch.id)}
                      disabled={disconnectingId === (ch.channel_id || ch.id)}
                      icon={<Unlink className="w-3.5 h-3.5 text-stone-400 group-hover:text-danger" />}
                      className="text-xs font-mono text-stone-500 hover:text-danger hover:bg-red-50"
                      title="Disconnect this YouTube channel"
                    >
                      <span>Disconnect</span>
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 rounded-xl bg-stone-50/70 border border-dashed border-stone-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-danger flex items-center justify-center mx-auto">
                <Youtube className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm text-text-primary">
                  No YouTube Channel Linked
                </p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Connect your YouTube channel using Google OAuth to automatically pull retention curves for your uploads.
                </p>
              </div>
              {isGuest && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRestoreDemo}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-accent" />}
                    className="text-xs font-mono"
                  >
                    <span>Restore Demo Sandbox Channel</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connect & Disconnect Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/60 p-4 rounded-xl border border-stone-200/60">
          <div className="text-xs text-text-secondary">
            <span className="font-medium text-text-primary">Required Scope: </span>
            <code className="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono">
              youtube.readonly
            </code>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {channels.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirmDisconnectId === "all") {
                    handleDisconnectChannel();
                  } else {
                    setConfirmDisconnectId("all");
                  }
                }}
                isLoading={disconnectingId === "all"}
                icon={<Unlink className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto justify-center text-xs font-mono text-danger hover:bg-red-50 border border-red-200/60"
              >
                <span>{confirmDisconnectId === "all" ? "Confirm Disconnect All?" : "Disconnect Channel"}</span>
              </Button>
            )}
            <a
              href={getYouTubeAuthUrl(userId)}
              className="inline-flex w-full sm:w-auto"
            >
              <Button
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto justify-center text-xs font-mono"
                icon={<Radio className="w-3.5 h-3.5 text-danger" />}
              >
                <span>{channels.length > 0 ? "Reconnect Channel" : "Connect YouTube Account"}</span>
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Section 3: AI Multi-Agent Forensic Configuration */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800/[0.06] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-text-primary">
                AI Forensic Engine
              </h2>
              <p className="text-xs text-text-secondary">
                Model assignment, sensitivity thresholds, and multi-agent debate settings.
              </p>
            </div>
          </div>
          <Badge variant="accent">Gemini 3.8 + Groq</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Multimodal Agent Model */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-text-secondary">
                Visual &amp; Audio Forensics
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                Active
              </span>
            </div>
            <p className="text-sm font-bold text-text-primary">
              Google Gemini 3.8 Flash
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Inspects keyframes, detects visual stagnancy, analyzes vocal cadence, and audits transition flow.
            </p>
          </div>

          {/* Critic & Reflection Agent Model */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-text-secondary">
                Adversarial Critic &amp; Studio Advisor
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                Active
              </span>
            </div>
            <p className="text-sm font-bold text-text-primary">
              Groq GPT-OSS 120B
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Challenging hypothesis tests, verifies evidence chains, and powers streaming studio advisor Q&amp;A.
            </p>
          </div>
        </div>

        {/* Sensitivity Option */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-mono font-medium text-text-secondary">
            Retention Cliff Drop Sensitivity
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "lenient" as const, title: "Lenient (20%+)", desc: "Flags only catastrophic drop points." },
              { id: "standard" as const, title: "Standard (15%+)", desc: "Balanced forensic detection (Recommended)." },
              { id: "strict" as const, title: "Strict (10%+)", desc: "Identifies subtle pacing slowdowns." },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSensitivity(s.id);
                  toast.success(`Sensitivity updated to ${s.title}`);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sensitivity === s.id
                    ? "bg-orange-50/70 border-accent text-text-primary ring-2 ring-accent/20"
                    : "bg-white hover:bg-stone-50 border-stone-200/80 text-text-secondary"
                }`}
              >
                <div className="font-semibold text-xs text-text-primary">{s.title}</div>
                <div className="text-[11px] text-text-tertiary pt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Critic debate toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-background-base/60 border border-stone-800/[0.06]">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-text-primary">
              Multi-Agent Adversarial Debate Loop
            </span>
            <p className="text-xs text-text-secondary">
              Require Critic Agent (Agent 6) to challenge and independently approve all cliff root causes before finalizing reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEnableCriticLoop(!enableCriticLoop);
              toast.success(`Critic debate loop ${!enableCriticLoop ? "enabled" : "disabled"}`);
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              enableCriticLoop ? "bg-accent" : "bg-stone-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                enableCriticLoop ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Section 4: Session Actions */}
      <Card className="p-6 sm:p-8 space-y-4 border-red-200/60 bg-red-50/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">
              Account Session
            </h2>
            <p className="text-xs text-text-secondary">
              Sign out from this device or end your guest evaluator sandbox.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            icon={<LogOut className="w-4 h-4" />}
          >
            <span>{isGuest ? "Exit Guest Mode" : "Sign Out"}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
