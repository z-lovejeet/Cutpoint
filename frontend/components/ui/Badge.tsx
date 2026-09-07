import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "accent";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[11px]",
  lg: "px-3 py-1 text-xs",
};

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-800 border-amber-200/80",
  danger: "bg-red-50 text-danger border-red-200/80",
  info: "bg-sky-50 text-sky-800 border-sky-200/80",
  neutral: "bg-stone-100 text-text-secondary border-stone-300/60",
  primary: "bg-stone-900/[0.05] text-stone-900 border-stone-800/15",
  accent: "bg-orange-50 text-accent-dark border-orange-200/80",
};

const dotColors: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-600",
  warning: "bg-amber-600",
  danger: "bg-red-600",
  info: "bg-sky-600",
  neutral: "bg-stone-400",
  primary: "bg-stone-900",
  accent: "bg-accent",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", size = "md", dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-tight select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";
