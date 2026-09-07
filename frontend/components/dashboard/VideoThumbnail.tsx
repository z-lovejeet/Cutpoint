"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface VideoThumbnailProps {
  videoId: string;
  title?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

export function VideoThumbnail({
  videoId,
  title,
  className = "",
  fill = true,
  priority = false,
}: VideoThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const isValidId = Boolean(videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId));

  if (!isValidId || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900 text-stone-200 p-4 select-none ${className}`}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-2 shadow-inner">
          <Play className="w-4 h-4 text-accent fill-accent ml-0.5" />
        </div>
        <span className="text-[11px] font-mono text-stone-400 text-center line-clamp-1 max-w-[85%]">
          {title || (videoId ? `ID: ${videoId}` : "Forensic Audit")}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
      alt={title || "Video thumbnail"}
      fill={fill}
      priority={priority}
      className={`object-cover group-hover:scale-105 transition-transform duration-300 ${className}`}
      sizes="(max-width: 640px) 100vw, 50vw"
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
