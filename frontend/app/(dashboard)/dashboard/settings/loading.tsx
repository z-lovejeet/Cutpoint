import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8 animate-fadeIn">
      {/* Header Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-800/[0.07] shadow-cozy p-8 sm:p-10 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-9 w-2/3 rounded-xl" />
        <SkeletonText lines={1} className="max-w-md" />
      </div>

      {/* User Identity & Profile Card Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <SkeletonCircle size={64} />
          <div className="space-y-2">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </SkeletonCard>

      {/* Connected Channels Card Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </SkeletonCard>

      {/* AI Forensics Config Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
}
