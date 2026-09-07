import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 animate-fadeIn">
      {/* Welcome Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-44 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <SkeletonText lines={2} className="max-w-xl" />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((n) => (
          <SkeletonCard key={n} className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </SkeletonCard>
        ))}
      </div>

      {/* Active Forensic Simulation Card Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="h-5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <div className="rounded-2xl border border-stone-800/[0.07] bg-white p-6 sm:p-8 shadow-cozy space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-52 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-48 sm:h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Action Panel Skeleton (YouTube Channels + Recent Forensic Runs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Channels */}
        <SkeletonCard className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200/60"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </SkeletonCard>

        {/* Right: Recent Forensic Runs */}
        <SkeletonCard className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-stone-50 border border-stone-200/60 overflow-hidden space-y-3 pb-3"
              >
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="px-3 space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-3 w-14 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
