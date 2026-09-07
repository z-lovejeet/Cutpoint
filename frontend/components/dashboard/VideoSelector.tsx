"use client";

import * as React from "react";
import Image from "next/image";
import { CheckCircle2, Clock, Eye, Play, Youtube, Radio, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { VideoListItem } from "@/types/database";

interface VideoSelectorProps {
  videos: VideoListItem[];
  selectedVideoId: string | null;
  onSelect: (videoId: string) => void;
  isLoading?: boolean;
  onRestoreDemo?: () => void;
}

export function VideoSelector({
  videos,
  selectedVideoId,
  onSelect,
  isLoading = false,
  onRestoreDemo,
}: VideoSelectorProps) {
  const [userId, setUserId] = React.useState<string>("");

  React.useEffect(() => {
    async function checkUser() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      } catch {
        // Fallback to guest mode
      }
    }
    checkUser();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="overflow-hidden p-0 border border-stone-200">
            <Skeleton className="h-44 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <Card className="p-8 sm:p-10 text-center space-y-4 border-dashed border-stone-300 bg-stone-50/70">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-danger flex items-center justify-center mx-auto shadow-sm">
          <Youtube className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-heading text-base font-semibold text-text-primary">
            No YouTube Channel Connected
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Link your YouTube account via OAuth 2.0 to import your recent uploads automatically, or enter any YouTube Video ID or URL above to analyze retention immediately.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
          <a
            href={`http://localhost:8000/api/v1/auth/youtube${userId ? `?user_id=${userId}` : ""}`}
            className="inline-flex"
          >
            <Button
              variant="secondary"
              size="sm"
              icon={<Radio className="w-3.5 h-3.5 text-danger" />}
              className="text-xs font-mono"
            >
              <span>Connect YouTube Channel</span>
            </Button>
          </a>

          {onRestoreDemo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRestoreDemo}
              icon={<RotateCcw className="w-3.5 h-3.5 text-accent" />}
              className="text-xs font-mono border border-stone-200"
            >
              <span>Restore Demo Catalog</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {videos.map((vid) => {
        const isSelected = selectedVideoId === vid.video_id;
        return (
          <div
            key={vid.video_id}
            onClick={() => onSelect(vid.video_id)}
            className={`group relative text-left rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden border ${
              isSelected
                ? "ring-2 ring-accent border-accent shadow-glow-subtle bg-orange-50/20"
                : "border-stone-800/[0.08] bg-white hover:border-stone-400 hover:shadow-card shadow-cozy"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
              {vid.thumbnail_url ? (
                <Image
                  src={vid.thumbnail_url}
                  alt={vid.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-500">
                  <Play className="w-10 h-10 opacity-40" />
                </div>
              )}

              {/* Selection overlay badge */}
              {isSelected ? (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-white font-mono text-[11px] font-semibold shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selected</span>
                </div>
              ) : (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2 py-1 rounded-md bg-stone-900/80 backdrop-blur-sm text-white text-[10px] font-mono">
                    Click to select
                  </span>
                </div>
              )}

              {/* Duration badge */}
              {vid.duration && (
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{vid.duration}</span>
                </div>
              )}
            </div>

            {/* Video Meta */}
            <div className="p-4 space-y-2.5">
              <h3 className="font-heading text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                {vid.title}
              </h3>

              <div className="flex items-center justify-between text-xs text-text-tertiary font-mono pt-1 border-t border-black/[0.04]">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {vid.view_count > 0 ? vid.view_count.toLocaleString() : "Audit Ready"}
                  </span>
                </div>
                <Badge variant={isSelected ? "accent" : "neutral"} className="text-[10px]">
                  {vid.video_id}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
