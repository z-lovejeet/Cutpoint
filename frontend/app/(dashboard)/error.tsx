"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <Card className="p-8 sm:p-10 space-y-6 shadow-cozy border-stone-800/[0.1] bg-white text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200/60 text-danger flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <Badge variant="danger" size="sm">
            Studio Service Alert
          </Badge>
          <h2 className="font-heading text-xl font-bold tracking-tight text-text-primary">
            Unable to Complete Studio Action
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
            {error.message ||
              "An error interrupted your current studio workflow. Your profile and channel data remain safely preserved."}
          </p>
        </div>

        {error.digest && (
          <div className="p-2.5 rounded-xl bg-neutral-100 font-mono text-[11px] text-text-tertiary select-all">
            Reference Code: {error.digest}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="accent"
            size="sm"
            onClick={() => reset()}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            <span>Retry Action</span>
          </Button>

          <Link href="/dashboard">
            <Button
              variant="secondary"
              size="sm"
              icon={<LayoutDashboard className="w-3.5 h-3.5" />}
            >
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
