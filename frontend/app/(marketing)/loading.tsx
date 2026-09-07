import * as React from "react";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function MarketingLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16 animate-fadeIn">
      {/* Hero Section Skeleton */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-center">
          <Skeleton className="h-7 w-48 rounded-full" />
        </div>
        <Skeleton className="h-12 sm:h-16 w-full rounded-2xl" />
        <SkeletonText lines={2} className="max-w-xl mx-auto" />
        <div className="flex justify-center gap-4 pt-2">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>

      {/* Hero Visualizer Skeleton */}
      <div className="rounded-2xl border border-stone-800/[0.07] bg-white p-6 sm:p-10 shadow-cozy space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-64 sm:h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
