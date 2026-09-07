"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Activity, Cpu, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkState() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data);
        }
      } catch (err) {
        console.warn("Subsystem check error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkState();
  }, []);

  return (
    <div className="min-h-screen bg-background-base text-text-primary flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background-base/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <span className="font-heading text-lg font-bold text-white tracking-tight">Cutpoint</span>
          </Link>

          <div className="flex items-center space-x-3">
            {userEmail ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-mono transition-all shadow-glow-primary"
              >
                <span>Studio Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-mono text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-mono transition-all shadow-glow-primary"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-16 overflow-hidden">
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
            <Link
              href={userEmail ? "/dashboard" : "/register"}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium shadow-glow-primary transition-all duration-200 active:scale-95"
            >
              <span>{userEmail ? "Go to Dashboard" : "Start Free Analysis"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl glass-card glass-card-hover text-text-secondary font-medium active:scale-95"
            >
              <span>Sign In with Google</span>
            </Link>
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
                  Auth & Database
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
    </div>
  );
}
