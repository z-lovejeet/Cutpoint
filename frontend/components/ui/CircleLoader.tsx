"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CircleLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  label?: string;
  sublabel?: string;
  className?: string;
  centerDot?: boolean;
}

const sizeConfig = {
  xs: {
    outer: "w-4 h-4",
    strokeWidth: 2.5,
    dot: "w-1 h-1",
    gap: "gap-1.5",
    text: "text-[11px]",
  },
  sm: {
    outer: "w-6 h-6",
    strokeWidth: 2.5,
    dot: "w-1.5 h-1.5",
    gap: "gap-2",
    text: "text-xs",
  },
  md: {
    outer: "w-10 h-10",
    strokeWidth: 3,
    dot: "w-2 h-2",
    gap: "gap-3",
    text: "text-sm",
  },
  lg: {
    outer: "w-16 h-16",
    strokeWidth: 3.5,
    dot: "w-3 h-3",
    gap: "gap-3.5",
    text: "text-base",
  },
  xl: {
    outer: "w-24 h-24",
    strokeWidth: 4,
    dot: "w-4 h-4",
    gap: "gap-4",
    text: "text-lg",
  },
};

export function CircleLoader({
  size = "md",
  label,
  sublabel,
  className,
  centerDot = true,
}: CircleLoaderProps) {
  const cfg = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center select-none",
        cfg.gap,
        className
      )}
      role="status"
      aria-label={label || "Loading..."}
    >
      <div className={cn("relative flex items-center justify-center", cfg.outer)}>
        {/* Static subtle background track ring */}
        <svg
          className="absolute inset-0 w-full h-full text-stone-200/80"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth={cfg.strokeWidth}
            opacity="0.5"
          />
        </svg>

        {/* Outer Orbital Ring (Terracotta Gradient) */}
        <svg
          className="absolute inset-0 w-full h-full animate-orbital text-accent"
          viewBox="0 0 48 48"
          fill="none"
        >
          <defs>
            <linearGradient id={`outer-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D95A2B" stopOpacity="1" />
              <stop offset="100%" stopColor="#D48828" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke={`url(#outer-grad-${size})`}
            strokeWidth={cfg.strokeWidth}
            strokeLinecap="round"
            strokeDasharray="95 35"
          />
        </svg>

        {/* Inner Counter-Rotating Ring (Amber Accent) */}
        <svg
          className="absolute inset-[15%] w-[70%] h-[70%] animate-orbital-reverse text-amber-500"
          viewBox="0 0 36 36"
          fill="none"
        >
          <defs>
            <linearGradient id={`inner-grad-${size}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D48828" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D95A2B" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <circle
            cx="18"
            cy="18"
            r="14"
            stroke={`url(#inner-grad-${size})`}
            strokeWidth={cfg.strokeWidth * 1.1}
            strokeLinecap="round"
            strokeDasharray="55 30"
          />
        </svg>

        {/* Center Pulsing Accent Core */}
        {centerDot && (
          <div
            className={cn(
              "rounded-full bg-gradient-to-tr from-accent to-amber-400 shadow-glow-subtle animate-pulse-soft z-10",
              cfg.dot
            )}
          />
        )}
      </div>

      {/* Optional Status Label & Sublabel */}
      {(label || sublabel) && (
        <div className="space-y-0.5 max-w-xs">
          {label && (
            <p className={cn("font-heading font-semibold text-text-primary tracking-tight", cfg.text)}>
              {label}
            </p>
          )}
          {sublabel && (
            <p className="font-mono text-xs text-text-tertiary">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
