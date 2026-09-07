"use client";

import * as React from "react";

interface HealthGaugeProps {
  score: number;
  grade: string;
  size?: number;
}

export function HealthGauge({ score, grade, size = 180 }: HealthGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Grade color matching
  const getColor = (g: string) => {
    switch (g?.toUpperCase()) {
      case "A":
        return { stroke: "#10B981", text: "text-emerald-600", bg: "bg-emerald-50" };
      case "B":
        return { stroke: "#0284C7", text: "text-sky-600", bg: "bg-sky-50" };
      case "C":
        return { stroke: "#F59E0B", text: "text-amber-600", bg: "bg-amber-50" };
      case "D":
        return { stroke: "#EA580C", text: "text-orange-600", bg: "bg-orange-50" };
      default:
        return { stroke: "#EF4444", text: "text-red-600", bg: "bg-red-50" };
    }
  };

  const colors = getColor(grade);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="rotate-[-90deg] w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E7E5E4"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-3xl font-extrabold text-text-primary tracking-tight">
            {Math.round(normalizedScore)}
          </span>
          <div
            className={`mt-0.5 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${colors.bg} ${colors.text} border border-black/[0.06]`}
          >
            Grade {grade || "N/A"}
          </div>
          <span className="text-[10px] uppercase font-mono text-text-tertiary mt-1">
            Retention Health
          </span>
        </div>
      </div>
    </div>
  );
}
