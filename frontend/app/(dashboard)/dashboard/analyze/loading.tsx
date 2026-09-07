import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function AnalyzeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 animate-fadeIn">
      {/* Header Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-44 rounded-full" />
        </div>
        <Skeleton className="h-9 w-2/3 rounded-xl" />
        <SkeletonText lines={2} className="max-w-xl" />
      </div>

      {/* Video Selection Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} className="overflow-hidden p-0 border border-stone-200/80">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>

      {/* Manual Input Card Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-56 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </SkeletonCard>
    </div>
  );
}
