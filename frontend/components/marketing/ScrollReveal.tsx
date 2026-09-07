"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.8,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const el = containerRef.current;

    let initialX = 0;
    let initialY = 0;

    switch (direction) {
      case "up":
        initialY = 36;
        break;
      case "down":
        initialY = -36;
        break;
      case "left":
        initialX = 36;
        break;
      case "right":
        initialX = -36;
        break;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          x: initialX,
          y: initialY,
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once,
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [direction, delay, duration, once]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export default ScrollReveal;
