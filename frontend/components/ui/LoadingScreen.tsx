"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { cn } from "@/lib/utils";

export interface LoadingScreenProps {
  isLoading?: boolean;
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({
  isLoading = true,
  label = "Preparing Studio Telemetry...",
  sublabel = "Initializing 8-Agent Retention Forensics",
  fullScreen = true,
  className,
}: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex flex-col items-center justify-center bg-[#FAF8F5]/90 backdrop-blur-md z-50 p-6",
            fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-2xl",
            className
          )}
        >
          {/* Ambient warm radial glow in background */}
          <div className="absolute w-72 h-72 rounded-full bg-orange-200/25 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center space-y-4">
            <CircleLoader
              size="lg"
              label={label}
              sublabel={sublabel}
              centerDot
            />

            {/* Subtle animated bar */}
            <div className="w-36 h-1 rounded-full bg-stone-200/80 overflow-hidden mt-2">
              <div className="w-full h-full bg-gradient-to-r from-accent via-amber-500 to-accent animate-[shimmer-fast_1.2s_infinite]" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
