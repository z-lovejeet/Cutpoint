"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  variant?: "mark" | "full";
  withBackground?: boolean;
  href?: string;
  className?: string;
  textClassName?: string;
}

const SIZE_MAP = {
  sm: 28,
  md: 34,
  lg: 44,
  xl: 56,
};

export function Logo({
  size = "md",
  variant = "full",
  withBackground = false,
  href,
  className = "",
  textClassName = "",
}: LogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size];
  const src = withBackground ? "/logo-bg.jpg" : "/logo.png";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-xl transition-transform duration-200 group-hover:scale-105 ${
          withBackground
            ? "overflow-hidden shadow-sm border border-stone-800/[0.08]"
            : "p-0.5"
        }`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src={src}
          alt="Cutpoint"
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {variant === "full" && (
        <span
          className={`font-heading text-lg font-bold text-text-primary tracking-tight ${textClassName}`}
        >
          Cutpoint
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
