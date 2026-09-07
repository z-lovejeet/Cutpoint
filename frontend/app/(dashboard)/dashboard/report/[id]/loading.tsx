import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText } from "@/components/ui/Skeleton";

export default function ReportDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 animate-fadeIn">
      {/* Top Header Banner Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-8 sm:h-10 w-4/5 rounded-xl" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Executive Overview: Health Gauge + 5-Pillar Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Health Gauge Skeleton */}
        <SkeletonCard className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <SkeletonCircle size={140} />
          <Skeleton className="h-6 w-36 rounded-md" />
          <SkeletonText lines={2} className="max-w-xs" />
        </SkeletonCard>

        {/* 5-Pillar Score Breakdown Skeleton */}
        <SkeletonCard className="lg:col-span-2 p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-52 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* 100-Point Retention Curve Chart Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-60 rounded-md" />
            <Skeleton className="h-3.5 w-40 rounded-md mt-1.5" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </SkeletonCard>

      {/* Cliff Diagnosis Cards Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <SkeletonText lines={3} />
              <div className="pt-2 border-t border-stone-200/60">
                <Skeleton className="h-4 w-full rounded-md" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
