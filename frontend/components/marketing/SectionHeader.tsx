"use client";

import React from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={`flex flex-col space-y-4 max-w-3xl ${
        isCenter ? "items-center text-center mx-auto" : "items-start text-left"
      } ${className}`}
    >
      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-stone-800/[0.08] shadow-cozy">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span className="text-[11px] font-mono tracking-wider uppercase text-text-secondary font-medium">
          {eyebrow}
        </span>
      </div>

      {/* Main heading */}
      <h2 className="font-heading text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-[-0.03em] text-text-primary leading-[1.12]">
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="font-sans text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;
