"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Activity, Cpu, ShieldCheck } from "lucide-react";

// Dynamically import the 3D scene with SSR disabled to prevent hydration mismatch
const ScenePlaceholder = dynamic(
  () => import("@/components/canvas/ScenePlaceholder"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-2xl glass-card flex items-center justify-center text-text-tertiary font-mono text-sm animate-pulse">
        Initializing Spatial 3D Engine...
      </div>
    ),
  }
);

interface HealthStatus {
  status: string;
  service: string;
  environment: string;
}

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data);
        }
      } catch (err) {
        console.warn("Backend API not reachable at root port yet:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-8 py-16 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl w-full z-10 flex flex-col items-center text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-card border-white/10 text-xs font-mono text-accent">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Content Engine Hackathon 2026</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
          Pinpoint the cuts that{" "}
          <span className="bg-gradient-to-r from-primary-light via-primary to-accent bg-clip-text text-transparent">
            cost you viewers
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed">
          Cutpoint merges YouTube retention calculus with Google Gemini 3.8 Flash
          multimodal AI to diagnose why audiences leave and prescribe editing changes that hold attention.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium shadow-glow-primary transition-all duration-200 active:scale-95">
            <span>Explore Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="flex items-center space-x-2 px-6 py-3.5 rounded-xl glass-card glass-card-hover text-text-secondary font-medium active:scale-95">
            <span>Read Architecture</span>
          </button>
        </div>

        {/* 3D Visualizer Container */}
        <div className="w-full pt-8">
          <ScenePlaceholder />
        </div>

        {/* Subsystem Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4">
          <div className="glass-card glass-card-hover p-5 rounded-xl text-left flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Backend Engine
              </span>
              <Activity className="w-4 h-4 text-primary-light" />
            </div>
            <div>
              <div className="font-heading text-xl font-semibold text-white">
                {isLoading ? "Checking..." : backendStatus ? "Operational" : "Offline (Local)"}
              </div>
              <p className="text-xs font-mono text-text-secondary pt-1">
                FastAPI • Python 3.13 • uv
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover p-5 rounded-xl text-left flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Multimodal AI
              </span>
              <Cpu className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="font-heading text-xl font-semibold text-white">
                Gemini 3.8 Flash
              </div>
              <p className="text-xs font-mono text-text-secondary pt-1">
                Vertex AI • Files API
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover p-5 rounded-xl text-left flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Auth & Security
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-heading text-xl font-semibold text-white">
                Supabase SSR
              </div>
              <p className="text-xs font-mono text-text-secondary pt-1">
                OAuth 2.0 • Row Level Security
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
