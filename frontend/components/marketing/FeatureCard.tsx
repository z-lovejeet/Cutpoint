"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  techTag: string;
  large?: boolean;
  iconBg?: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  techTag,
  large = false,
  iconBg = "bg-orange-50 border-orange-200/80 text-accent",
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`cozy-card cozy-card-hover glow-hover p-6 sm:p-7 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden group ${
        large ? "md:col-span-2" : "col-span-1"
      } ${className}`}
    >
      <div className="space-y-4">
        {/* Icon & Eyebrow */}
        <div className="flex items-center justify-between">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono text-text-tertiary px-2.5 py-1 rounded-md bg-stone-100/80 border border-stone-200/60">
            {techTag}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-lg sm:text-xl font-bold text-text-primary tracking-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="font-sans text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {/* Decorative accent line on hover */}
      <div className="pt-5 mt-2 border-t border-stone-800/[0.05] flex items-center justify-between text-xs font-mono text-text-tertiary">
        <span>Autonomous Specialist</span>
        <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          Ready →
        </span>
      </div>
    </div>
  );
}

export default FeatureCard;
