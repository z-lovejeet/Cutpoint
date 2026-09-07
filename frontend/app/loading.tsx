import * as React from "react";
import { CircleLoader } from "@/components/ui/CircleLoader";

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF8F5] p-6 select-none">
      <div className="relative flex flex-col items-center space-y-4">
        <CircleLoader
          size="lg"
          label="Loading Cutpoint Studio..."
          sublabel="Syncing video retention telemetry"
          centerDot
        />
        <div className="w-32 h-1 rounded-full bg-stone-200/80 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-accent via-amber-500 to-accent animate-[shimmer-fast_1.2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
