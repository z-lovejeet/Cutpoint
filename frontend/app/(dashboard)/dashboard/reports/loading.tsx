import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 animate-fadeIn">
      {/* Header Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
            <Skeleton className="h-9 w-3/4 rounded-xl" />
            <SkeletonText lines={1} className="max-w-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Reports List Skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <SkeletonCard key={n} className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-xl shrink-0 self-end sm:self-center" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
