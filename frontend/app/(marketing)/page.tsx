"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Activity,
  Search,
  FileCheck,
  Eye,
  TrendingDown,
  Volume2,
  AlertOctagon,
  MessageSquareCode,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { StatsCounter } from "@/components/marketing/StatsCounter";

// Dynamically import the visualizer component with SSR disabled
const ScenePlaceholder = dynamic(
  () => import("@/components/canvas/ScenePlaceholder"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl bg-white border border-stone-800/[0.08] flex items-center justify-center text-text-tertiary font-mono text-xs animate-pulse shadow-cozy">
        Loading Retention Timeline Visualizer...
      </div>
    ),
  }
);

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        } else if (
          typeof document !== "undefined" &&
          document.cookie.includes("cutpoint_guest_session=true")
        ) {
          setUserEmail("Guest Evaluator");
        }
      } catch (err) {
        console.warn("User check error:", err);
      }
    }
    checkUser();
  }, []);

  // Parallax scroll effect for ambient background gradient blobs
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const blob1 = document.getElementById("hero-blob-1");
          const blob2 = document.getElementById("hero-blob-2");
          const ctaBlob = document.getElementById("cta-blob");
          if (blob1) blob1.style.transform = `translateX(-50%) translateY(${scrollY * 0.16}px)`;
          if (blob2) blob2.style.transform = `translateX(-50%) translateY(${scrollY * 0.08}px)`;
          if (ctaBlob) ctaBlob.style.transform = `translate(-50%, -50%) translateY(${scrollY * -0.05}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden site-lighting">
      {/* Editorial paper grid overlay */}
      <div className="absolute inset-0 bg-editorial-grid opacity-35 pointer-events-none" />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO */}
      {/* ========================================================================= */}
      <section className="relative w-full px-4 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 flex flex-col items-center text-center z-10">
        {/* Warm Ambient Architectural Spotlight with Parallax */}
        <div
          id="hero-blob-1"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[520px] bg-gradient-to-b from-amber-200/30 via-orange-100/20 to-transparent rounded-full blur-[140px] pointer-events-none parallax-slow"
        />
        <div
          id="hero-blob-2"
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[550px] h-[220px] bg-gradient-to-r from-orange-100/30 via-amber-100/20 to-transparent rounded-full blur-[100px] pointer-events-none parallax-fast"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl w-full flex flex-col items-center space-y-8"
        >
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-stone-800/[0.08] shadow-cozy backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-mono tracking-wider uppercase text-text-secondary font-medium">
              Retention Forensics
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs font-mono text-text-tertiary">
              AI Content Engine 2026
            </span>
          </div>

          {/* Editorial Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-[64px] font-bold tracking-[-0.035em] text-text-primary leading-[1.08] max-w-3xl">
            See the exact second you lost them.{" "}
            <span className="text-accent font-semibold">
              And the cut that fixes it.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-base sm:text-xl text-text-secondary max-w-2xl leading-relaxed font-normal tracking-[-0.01em]">
            Most creators watch their watch-time graphs collapse and guess what went wrong. Cutpoint investigates every drop-off timestamp — auditing camera pacing, audio dynamics, and topic drift to prescribe concrete edits that hold attention.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
            <Button
              variant="primary"
              size="lg"
              asChild
              className="rounded-xl px-7 py-3.5 bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-card"
            >
              <Link
                href={userEmail ? "/dashboard" : "/register"}
                className="flex items-center gap-2.5"
              >
                <span className="font-medium text-sm">
                  {userEmail ? "Go to Studio Dashboard" : "Audit Your Retention"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="rounded-xl px-6 py-3.5 border-stone-300/80 bg-white hover:bg-stone-50 text-text-primary shadow-cozy"
            >
              <Link href="/about" className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <span>How the Forensics Work</span>
              </Link>
            </Button>
          </div>

          {/* Quick Evaluator / Guest Sandbox Link */}
          {!userEmail && (
            <div className="pt-0.5">
              <Link
                href="/auth/guest"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50/80 hover:bg-orange-100/90 border border-accent/25 text-accent text-xs font-mono transition-colors shadow-cozy"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Evaluating the project? Enter Instant Guest Sandbox (No Login Required) →</span>
              </Link>
            </div>
          )}

          {/* Methodology Strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1 text-xs font-mono text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>SciPy Drop Calculus</span>
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Gemini 3.8 Flash Multimodal Investigation</span>
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Actionable Timeline Prescriptions</span>
            </span>
          </div>

          {/* Interactive Retention Timeline Visualizer */}
          <div className="w-full pt-8">
            <ScenePlaceholder />
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE PROBLEM STATEMENT */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 border-t border-stone-800/[0.06] relative z-10 bg-white/40">
        <div className="max-w-6xl mx-auto space-y-16">
          <ScrollReveal direction="up">
            <SectionHeader
              eyebrow="The Retention Paradox"
              title={
                <>
                  YouTube shows you the cliff.{" "}
                  <span className="text-accent">
                    It never shows you why they jumped.
                  </span>
                </>
              }
              subtitle="Creators spend 40+ hours producing high-effort videos, only to watch retention drop 30% in the first two minutes. Current analytics only confirm the damage—they never diagnose the root cause."
            />
          </ScrollReveal>

          {/* 3 Metric Counters */}
          <ScrollReveal direction="up" delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCounter
                value="8–12 hrs"
                label="Wasted per Video"
                sublabel="Creators scrub timelines guessing why audience engagement cratered."
              />
              <StatsCounter
                value="73%"
                label="Primary Growth Blocker"
                sublabel="Of mid-market channels stall due to unexplained mid-video viewer departures."
              />
              <StatsCounter
                value="0"
                label="Root-Cause Explanations"
                sublabel="Standard analytics provide graphs and percentages, zero editing prescriptions."
              />
            </div>
          </ScrollReveal>

          {/* Contrast Matrix: Traditional vs. Cutpoint */}
          <ScrollReveal direction="up" delay={0.25}>
            <div className="cozy-card p-6 sm:p-8 rounded-2xl overflow-hidden text-left space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/[0.06] pb-4">
                <span className="font-heading text-lg font-bold text-text-primary">
                  The Diagnostic Gap in YouTube Analytics
                </span>
                <span className="text-xs font-mono text-accent font-medium">
                  Traditional Analytics vs. Cutpoint Forensics
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="p-5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-danger font-semibold">
                    <XCircle className="w-4 h-4" />
                    <span>Traditional Studio Analytics (Observation Only)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-text-secondary leading-relaxed list-disc list-inside">
                    <li>Displays a generic percentage drop line at 02:14.</li>
                    <li>Forces you to re-watch the segment dozens of times to guess why.</li>
                    <li>Blames generic factors like &ldquo;maybe the intro was slow&rdquo;.</li>
                    <li>No actionable adjustment for your next video export.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-orange-50/60 border border-orange-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Cutpoint Autonomous Forensics (Actionable Diagnosis)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-text-secondary leading-relaxed list-disc list-inside">
                    <li>Isolates the exact -18.4% inflection point via calculus.</li>
                    <li>Gemini 3.8 Flash flags 14 seconds of static framing with dead air.</li>
                    <li>Retention Critic verifies hypothesis against audio/visual evidence.</li>
                    <li>Prescription: &ldquo;Insert B-roll hook or cut 6s of hesitation at 02:10&rdquo;.</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: HOW IT WORKS (3-STEP PIPELINE) */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 relative z-10 border-t border-stone-800/[0.06]">
        <div className="max-w-6xl mx-auto space-y-16">
          <ScrollReveal direction="up">
            <SectionHeader
              eyebrow="How Cutpoint Works"
              title="From raw analytics to surgical prescriptions in 90 seconds."
              subtitle="Three systematic stages transform opaque watch-time graphs into an authoritative editing blueprint."
            />
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <ScrollReveal direction="up" delay={0.1}>
              <div className="cozy-card cozy-card-hover p-7 rounded-2xl flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shadow-sm">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-accent">
                      01 / INGEST
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text-primary">
                    Pull & Validate Retention Curves
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed">
                    Connect your channel securely via OAuth. The Data Ingestion Agent imports your raw second-by-second retention curve, validates data resolution, and filters measurement noise.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-800/[0.06] text-xs font-mono text-text-tertiary">
                  Data Ingestion Agent • Quota Healing
                </div>
              </div>
            </ScrollReveal>

            {/* Step 2 */}
            <ScrollReveal direction="up" delay={0.2}>
              <div className="cozy-card cozy-card-hover p-7 rounded-2xl flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-accent shadow-sm">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-accent">
                      02 / INVESTIGATE
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text-primary">
                    Calculus Discovery & Multimodal Audit
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed">
                    SciPy first-derivative calculus pinpoints exact drop timestamps. Gemini 3.8 Flash inspects keyframes, measuring visual stagnancy, edit cut frequency, speaker eye contact, and audio dead air.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-800/[0.06] text-xs font-mono text-text-tertiary">
                  Cliff Detector • Gemini 3.8 Flash
                </div>
              </div>
            </ScrollReveal>

            {/* Step 3 */}
            <ScrollReveal direction="up" delay={0.3}>
              <div className="cozy-card cozy-card-hover p-7 rounded-2xl flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shadow-sm">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-accent">
                      03 / PRESCRIBE
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text-primary">
                    Debate Verification & Executive Report
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed">
                    The Retention Critic challenges hypotheses to eliminate false positives. The Report Synthesizer then delivers your letter-grade report with ranked, timestamped editing prescriptions.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-800/[0.06] text-xs font-mono text-text-tertiary">
                  Retention Critic • Report Synthesizer
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: FEATURES BENTO GRID */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 bg-white/40 border-t border-stone-800/[0.06] relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          <ScrollReveal direction="up">
            <SectionHeader
              eyebrow="Specialist Capabilities"
              title="Eight autonomous agents. One forensic verdict."
              subtitle="Unlike generic prompt wrappers, Cutpoint deploys specialized autonomous agents equipped with function calling, signal math, and adversarial debate loops."
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1: Large Multimodal Forensic */}
              <FeatureCard
                icon={Eye}
                title="Multimodal Video Keyframe Forensics"
                description="Watches the exact seconds where viewer drops occur. Invokes tools to inspect keyframes, calculate visual stagnancy indices, evaluate cut frequency against video averages, and detect disengaged speaker framing."
                techTag="Gemini 3.8 Flash • Tool Calling"
                iconBg="bg-orange-50 border-orange-200/80 text-accent"
                large={true}
              />

              {/* Feature 2: Calculus-based Cliff Detection */}
              <FeatureCard
                icon={TrendingDown}
                title="SciPy Peak & Gradient Calculus"
                description="Mathematical anomaly detection applying Gaussian smoothing, first-derivative negative slopes, and z-score outlier analysis to isolate genuine audience drop-offs from expected gradual falloff."
                techTag="NumPy / SciPy Signal Math"
                iconBg="bg-rose-50 border-rose-200/80 text-rose-700"
              />

              {/* Feature 3: Audio & Cadence Agent */}
              <FeatureCard
                icon={Volume2}
                title="Acoustic Energy & Cadence Audit"
                description="Pinpoints hidden acoustic drop causes: awkward pauses (>2.0s), sudden slowdowns in words-per-minute delivery, monotone fatigue, and jarring volume disparities between speech and music."
                techTag="Gemini Multimodal Audio"
                iconBg="bg-amber-50 border-amber-200/80 text-amber-800"
              />

              {/* Feature 4: Retention Critic Agent */}
              <FeatureCard
                icon={AlertOctagon}
                title="Adversarial Verification & Debate Loop"
                description="Acts as the devil's advocate. Generates counter-hypotheses for every forensic claim, checks cross-cliff consistency, and forces re-investigation if confidence scores fall below threshold."
                techTag="Groq GPT-OSS 120B Reasoning"
                iconBg="bg-red-50 border-red-200/80 text-danger"
              />

              {/* Feature 5: Report Synthesizer */}
              <FeatureCard
                icon={FileCheck}
                title="Retention Health Score & Ranked Blueprints"
                description="Synthesizes mathematical severity into a 0–100 Retention Health Score, letter grades (A–F), and chronological editing checklists prioritized by expected audience retention gains."
                techTag="Groq GPT-OSS 20B Fast Gen"
                iconBg="bg-emerald-50 border-emerald-200/80 text-emerald-800"
              />

              {/* Feature 6: Strategist Chat Agent */}
              <FeatureCard
                icon={MessageSquareCode}
                title="Interactive Studio Advisor with Function Calling"
                description="Chat with an elite YouTube strategist who knows your video's forensic data intimately. Calls tools to re-examine specific timestamps, compare cliffs side-by-side, and suggest re-edits for future uploads."
                techTag="Groq GPT-OSS 120B • Dynamic Tool Use"
                iconBg="bg-blue-50 border-blue-200/80 text-blue-700"
                large={true}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: SOCIAL PROOF / TRUST STRIP */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-16 sm:py-20 border-t border-stone-800/[0.06] relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <ScrollReveal direction="up">
            <div className="cozy-card p-8 sm:p-10 rounded-2xl relative overflow-hidden space-y-5">
              <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
                Creator Case Study
              </div>

              <blockquote className="font-heading text-xl sm:text-2xl font-medium text-text-primary leading-relaxed italic">
                “Traditional analytics showed me I was losing 28% of my audience around minute 3. Cutpoint discovered it was a 14-second static talking-head without B-roll right after an unannounced sponsor bridge. That single prescription boosted my next video&apos;s average view duration by 41%.”
              </blockquote>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs font-mono text-text-tertiary">
                <span className="font-semibold text-text-primary">
                  Marcus Vance
                </span>
                <span className="hidden sm:inline">•</span>
                <span>Tech & Engineering Creator (340K Subs)</span>
                <span className="hidden sm:inline">•</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  +41% Retention Recovery
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: BOTTOM CTA */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 border-t border-stone-800/[0.06] relative z-10 bg-white/60">
        {/* Subtle warm glow behind bottom CTA */}
        <div
          id="cta-blob"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-200/20 via-orange-100/30 to-transparent rounded-full blur-[120px] pointer-events-none parallax-slow"
        />

        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <ScrollReveal direction="up">
            <div className="space-y-4">
              <h2 className="font-heading text-3xl sm:text-5xl lg:text-[54px] font-bold text-text-primary tracking-tight leading-[1.12]">
                Stop guessing.{" "}
                <span className="text-accent">Start auditing.</span>
              </h2>
              <p className="font-sans text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
                Connect your YouTube channel or inspect sample analyses. Get timestamp-specific editing prescriptions in under two minutes.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                asChild
                className="rounded-xl px-8 py-4 bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-card text-sm font-medium"
              >
                <Link
                  href={userEmail ? "/dashboard" : "/register"}
                  className="flex items-center gap-2.5"
                >
                  <span>
                    {userEmail ? "Open Studio Dashboard" : "Audit Your Retention"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                asChild
                className="rounded-xl px-7 py-4 border-stone-300/80 bg-white hover:bg-stone-50 text-text-primary shadow-cozy text-sm font-medium"
              >
                <Link href="/about">Explore 8-Agent Pipeline</Link>
              </Button>
            </div>
          </ScrollReveal>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-xs font-mono text-text-tertiary">
            <span>Supabase Row-Level Security</span>
            <span>•</span>
            <span>Zero Hallucination Grounding</span>
            <span>•</span>
            <span>Free Tier Available</span>
          </div>
        </div>
      </section>
    </div>
  );
}
