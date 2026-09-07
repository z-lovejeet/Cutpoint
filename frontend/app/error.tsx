"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global Application Error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-text-primary">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-cozy border-stone-800/[0.1] bg-white">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/60 text-accent flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <Badge variant="warning" size="sm">
            Runtime Exception
          </Badge>
          <h2 className="font-heading text-xl font-bold tracking-tight text-text-primary">
            Something Went Wrong
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            An unexpected error occurred during execution. The forensic state has been isolated to protect your data.
          </p>
        </div>

        {error.digest && (
          <div className="p-2.5 rounded-xl bg-neutral-100 font-mono text-[11px] text-text-tertiary select-all">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="accent"
            size="sm"
            onClick={() => reset()}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            <span>Try Again</span>
          </Button>

          <Link href="/">
            <Button
              variant="secondary"
              size="sm"
              icon={<Home className="w-3.5 h-3.5" />}
            >
              <span>Overview</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
