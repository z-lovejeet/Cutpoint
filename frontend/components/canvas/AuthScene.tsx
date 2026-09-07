"use client";

import React, { useEffect, useState } from "react";

export default function AuthScene() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background-base">
      {/* Editorial paper grid */}
      <div className="absolute inset-0 bg-editorial-grid opacity-50" />

      {/* Warm Ambient Architectural Lighting (Terracotta, Warm Amber & Cream) */}
      <div
        style={{
          transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)`,
          transition: "transform 0.25s ease-out",
        }}
        className="absolute -top-36 -left-36 w-[560px] h-[560px] bg-gradient-to-br from-orange-200/25 via-amber-100/20 to-transparent rounded-full blur-[130px] animate-pulse-subtle"
      />
      <div
        style={{
          transform: `translate(${-mousePos.x * 0.7}px, ${-mousePos.y * 0.7}px)`,
          transition: "transform 0.25s ease-out",
        }}
        className="absolute -bottom-36 -right-36 w-[560px] h-[560px] bg-gradient-to-tl from-amber-200/30 via-orange-100/20 to-transparent rounded-full blur-[130px] animate-pulse-subtle"
      />
      <div
        style={{
          transform: `translate(-50%, -50%) translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`,
          transition: "transform 0.3s ease-out",
        }}
        className="absolute top-1/2 left-1/2 w-[720px] h-[440px] bg-amber-50/60 rounded-full blur-[150px]"
      />
    </div>
  );
}
