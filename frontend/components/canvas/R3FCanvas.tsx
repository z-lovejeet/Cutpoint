"use client";

import React, { Suspense } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { Preload } from "@react-three/drei";

interface R3FCanvasProps extends Omit<CanvasProps, "children"> {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Reusable React Three Fiber canvas wrapper with standard defaults.
 * - Warm ambient + directional lighting matching the editorial palette
 * - Suspense boundary with configurable fallback
 * - Preload for performance
 * - Anti-aliasing and proper DPR clamping
 *
 * Usage:
 * ```tsx
 * import dynamic from "next/dynamic";
 * const Scene = dynamic(() => import("@/components/canvas/R3FCanvas"), { ssr: false });
 * ```
 */
export default function R3FCanvas({
  children,
  fallback,
  className,
  ...canvasProps
}: R3FCanvasProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center w-full h-full">
      <span className="text-xs font-mono text-text-tertiary animate-pulse">
        Loading 3D scene…
      </span>
    </div>
  );

  return (
    <div className={className ?? "w-full h-full"}>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
        {...canvasProps}
      >
        <Suspense fallback={null}>
          {/* Warm editorial lighting to match the ivory/terracotta palette */}
          <ambientLight intensity={0.7} color="#FAF8F5" />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.8}
            color="#FFF8F0"
            castShadow={false}
          />
          <directionalLight
            position={[-3, 2, 4]}
            intensity={0.4}
            color="#D95A2B"
          />
          {/* Terracotta rim & amber accent lights */}
          <pointLight position={[-4, 3, -2]} intensity={0.4} color="#D95A2B" />
          <pointLight position={[3, -2, 2]} intensity={0.25} color="#D48828" />

          {children}

          <Preload all />
        </Suspense>
      </Canvas>

      {/* HTML fallback overlay while scene loads */}
      <noscript>{fallback ?? defaultFallback}</noscript>
    </div>
  );
}
