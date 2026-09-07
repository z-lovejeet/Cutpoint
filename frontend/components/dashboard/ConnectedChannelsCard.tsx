"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Youtube,
  Radio,
  Unlink,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { disconnectYouTube, restoreGuestChannel } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { YouTubeChannel } from "@/types/database";

interface ConnectedChannelsCardProps {
  initialChannels: YouTubeChannel[];
  isGuest: boolean;
  userId?: string;
}

export function ConnectedChannelsCard({
  initialChannels,
  isGuest,
  userId,
}: ConnectedChannelsCardProps) {
  const router = useRouter();
  const [channels, setChannels] = React.useState<YouTubeChannel[]>(initialChannels);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = React.useState<string | null>(null);
  const [isRestoring, setIsRestoring] = React.useState(false);

  // Sync state if server props change or channel update event fires
  React.useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  React.useEffect(() => {
    const handleChannelUpdated = () => {
      router.refresh();
    };
    window.addEventListener("cutpoint_channel_updated", handleChannelUpdated);
    return () => {
      window.removeEventListener("cutpoint_channel_updated", handleChannelUpdated);
    };
  }, [router]);

  const handleDisconnect = async (channelId?: string, channelName?: string) => {
    try {
      setDisconnectingId(channelId || "all");
      setConfirmDisconnectId(null);

      // 1. Call backend API
      await disconnectYouTube(channelId);

      // 2. If authenticated, also ensure client-side Supabase deletion
      if (!isGuest && userId) {
        try {
          const supabase = createClient();
          let query = supabase.from("youtube_channels").delete().eq("user_id", userId);
          if (channelId) {
            query = query.or(`channel_id.eq.${channelId},id.eq.${channelId}`);
          }
          await query;
        } catch (supabaseErr) {
          console.warn("Direct Supabase channel deletion error:", supabaseErr);
        }
      }

      // 3. Update local state
      if (channelId) {
        setChannels((prev) => prev.filter((c) => c.channel_id !== channelId && c.id !== channelId));
      } else {
        setChannels([]);
      }

      toast.success(
        channelName
          ? `Channel "${channelName}" disconnected successfully`
          : "YouTube channel disconnected successfully"
      );

      // Refresh server components
      router.refresh();
    } catch (err) {
      console.error("Failed to disconnect YouTube channel:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect YouTube channel"
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleRestoreDemo = () => {
    try {
      setIsRestoring(true);
      restoreGuestChannel();
      toast.success("Demo sandbox channel restored");
      router.refresh();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            YouTube Channels
          </h2>
          <span className="text-xs font-mono text-text-tertiary">
            ({channels.length})
          </span>
        </div>
        <Badge variant="primary">{isGuest ? "Sandbox Sync" : "OAuth 2.0"}</Badge>
      </div>

      {channels.length > 0 ? (
        <div className="space-y-3">
          {channels.map((ch: YouTubeChannel) => {
            const isConfirming = confirmDisconnectId === (ch.channel_id || ch.id);
            const isDeleting = disconnectingId === (ch.channel_id || ch.id);

            return (
              <div
                key={ch.id || ch.channel_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background-base/70 border border-black/[0.05] gap-3 transition-all"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-danger flex items-center justify-center shadow-sm shrink-0">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-text-primary text-sm truncate">
                      {ch.channel_name}
                    </div>
                    <div className="text-xs font-mono text-text-tertiary truncate">
                      {ch.channel_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Badge variant="success" dot>
                    {isGuest ? "Demo Linked" : "Connected"}
                  </Badge>

                  {/* Disconnect Channel Action */}
                  {isConfirming ? (
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
                        isLoading={isDeleting}
                        onClick={() => handleDisconnect(ch.channel_id || ch.id, ch.channel_name)}
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
                      disabled={isDeleting}
                      icon={<Unlink className="w-3.5 h-3.5 text-stone-400 group-hover:text-danger" />}
                      className="text-xs font-mono text-stone-500 hover:text-danger hover:bg-red-50 transition-colors"
                      title="Disconnect this YouTube channel"
                    >
                      <span>Disconnect</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-stone-50/80 border border-dashed border-stone-300/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-danger flex items-center justify-center mx-auto shadow-sm">
            <Youtube className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm text-text-primary">
              No YouTube Channel Connected
            </p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Connect your YouTube account via OAuth 2.0 to sync video watch-time curves directly from YouTube Studio, or paste any video ID or URL to analyze.
            </p>
          </div>
          {isGuest && (
            <div className="pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRestoreDemo}
                isLoading={isRestoring}
                icon={<RotateCcw className="w-3.5 h-3.5 text-accent" />}
                className="text-xs font-mono"
              >
                <span>Restore Demo Sandbox Channel</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <a
          href={`http://localhost:8000/api/v1/auth/youtube${userId ? `?user_id=${userId}` : ""}`}
          className="w-full flex-1 inline-flex"
        >
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center text-xs font-mono"
            icon={<Radio className="w-3.5 h-3.5 text-danger" />}
          >
            <span>
              {channels.length > 0 ? "Connect Another / Re-link Channel" : "Connect YouTube Channel"}
            </span>
          </Button>
        </a>

        {channels.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirmDisconnectId === "all") {
                handleDisconnect();
              } else {
                setConfirmDisconnectId("all");
              }
            }}
            isLoading={disconnectingId === "all"}
            icon={<Unlink className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto text-xs font-mono text-danger hover:bg-red-50 border border-red-200/60"
          >
            <span>{confirmDisconnectId === "all" ? "Confirm Disconnect All?" : "Disconnect YouTube"}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
