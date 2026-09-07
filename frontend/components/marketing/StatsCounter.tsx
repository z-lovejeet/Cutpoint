"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface StatsCounterProps {
  value: string;
  label: string;
  sublabel?: string;
  className?: string;
}

export function StatsCounter({
  value,
  label,
  sublabel,
  className = "",
}: StatsCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const [displayValue, setDisplayValue] = React.useState<string>(value);

  React.useEffect(() => {
    if (!isInView) return;

    // Check if value starts with a number or contains a percentage
    const match = value.match(/^(\d+)(.*)$/);
    if (match) {
      const targetNum = parseInt(match[1], 10);
      const suffix = match[2];
      const duration = 1200;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic curve
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(targetNum * easedProgress);

        setDisplayValue(`${currentVal}${suffix}`);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [isInView, value]);

  return (
    <div
      ref={ref}
      className={`cozy-card glow-hover p-6 sm:p-7 rounded-2xl flex flex-col items-center text-center justify-between space-y-2 relative overflow-hidden ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center"
      >
        <span className="font-heading text-4xl sm:text-5xl lg:text-[54px] font-bold text-text-primary tracking-tight">
          {displayValue}
        </span>
        <span className="font-heading text-sm sm:text-base font-semibold text-text-primary pt-2">
          {label}
        </span>
        {sublabel && (
          <span className="font-sans text-xs text-text-secondary leading-relaxed pt-1 max-w-[240px]">
            {sublabel}
          </span>
        )}
      </motion.div>
    </div>
  );
}

export default StatsCounter;
