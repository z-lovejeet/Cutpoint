import * as React from "react";
import { CircleLoader } from "@/components/ui/CircleLoader";

export default function DashboardGroupLoading() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh] py-16">
      <CircleLoader
        size="md"
        label="Connecting to Studio Engine..."
        sublabel="Verifying pipeline state"
        centerDot
      />
    </div>
  );
}
