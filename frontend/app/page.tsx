"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Activity, Cpu, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Dynamically import the visualizer component with SSR disabled
const ScenePlaceholder = dynamic(
  () => import("@/components/canvas/ScenePlaceholder"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center text-text-tertiary font-mono text-xs animate-pulse shadow-cozy">
        Loading Retention Timeline Visualizer...
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
    <div className="min-h-screen bg-background-base text-text-primary flex flex-col selection:bg-primary/10 selection:text-primary">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading text-lg font-bold text-text-primary tracking-tight">
              Cutpoint
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {userEmail ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-mono transition-all shadow-sm"
              >
                <span>Studio Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 rounded-xl border border-black/[0.08] text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-black/[0.02] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-mono transition-all shadow-sm"
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
        {/* Cozy soft ambient lighting */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-100/50 via-purple-50/30 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl w-full z-10 flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-xs font-mono text-primary shadow-cozy">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Content Engine Hackathon 2026</span>
          </div>

          {/* Hero Title */}
          <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-text-primary leading-[1.12]">
            Pinpoint the cuts that{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              cost you viewers
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
            Cutpoint merges YouTube retention calculus with Google Gemini 3.8 Flash multimodal AI
            to diagnose why audiences leave and prescribe precise editing changes that hold attention.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href={userEmail ? "/dashboard" : "/register"}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <span>{userEmail ? "Go to Studio Dashboard" : "Analyze Your Retention"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-50 border border-black/[0.08] text-text-secondary font-medium shadow-cozy active:scale-[0.98] transition-colors"
            >
              <span>Sign In with Google</span>
            </Link>
          </div>

          {/* Interactive Retention Timeline Visualizer */}
          <div className="w-full pt-6">
            <ScenePlaceholder />
          </div>

          {/* Subsystem Health Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4">
            <div className="cozy-card cozy-card-hover p-5 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                  Backend Engine
                </span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-heading text-lg font-semibold text-text-primary">
                  {isLoading ? "Checking..." : backendStatus ? "Operational" : "Offline (Local)"}
                </div>
                <p className="text-xs font-mono text-text-tertiary pt-1">
                  FastAPI • Python 3.13 • uv
                </p>
              </div>
            </div>

            <div className="cozy-card cozy-card-hover p-5 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                  Multimodal AI
                </span>
                <Cpu className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="font-heading text-lg font-semibold text-text-primary">
                  Gemini 3.8 Flash
                </div>
                <p className="text-xs font-mono text-text-tertiary pt-1">
                  Vertex AI • Files API
                </p>
              </div>
            </div>

            <div className="cozy-card cozy-card-hover p-5 rounded-2xl text-left flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                  Auth & Database
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="font-heading text-lg font-semibold text-text-primary">
                  Supabase SSR
                </div>
                <p className="text-xs font-mono text-text-tertiary pt-1">
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
