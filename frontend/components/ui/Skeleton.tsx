import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shimmer = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-stone-200/60 animate-pulse",
        shimmer &&
          "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer-fast_1.25s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export function SkeletonCircle({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5 rounded-md",
            i === lines - 1 ? "w-2/3" : i === 0 ? "w-full" : "w-5/6"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy space-y-4",
        className
      )}
    >
      {children || (
        <>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <SkeletonText lines={2} />
        </>
      )}
    </div>
  );
}
