"use client";

import React from "react";

export default function AuthScene() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background-base">
      {/* Subtle warm dot grid */}
      <div className="absolute inset-0 bg-subtle-grid opacity-60" />

      {/* Cozy soft ambient lighting (Warm Amber & Indigo) */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-to-br from-indigo-200/40 via-purple-100/30 to-transparent rounded-full blur-[120px] animate-pulse-subtle" />
      <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-gradient-to-tl from-amber-100/50 via-sky-100/30 to-transparent rounded-full blur-[120px] animate-pulse-subtle" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-50/50 rounded-full blur-[140px]" />
    </div>
  );
}
