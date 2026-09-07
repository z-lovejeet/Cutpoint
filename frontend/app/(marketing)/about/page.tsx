"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { AgentPipelineVisual } from "@/components/marketing/AgentPipelineVisual";
import { TechStackGrid } from "@/components/marketing/TechStackGrid";

export default function AboutPage() {
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
        }
      } catch (err) {
        console.warn("User check error:", err);
      }
    }
    checkUser();
  }, []);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden site-lighting">
      {/* Editorial grid overlay */}
      <div className="absolute inset-0 bg-editorial-grid opacity-35 pointer-events-none" />

      {/* ========================================================================= */}
      {/* SECTION 1: ABOUT HERO */}
      {/* ========================================================================= */}
      <section className="relative w-full px-4 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-24 flex flex-col items-center text-center z-10">
        {/* Warm Ambient Spotlight */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-b from-amber-200/25 via-orange-100/20 to-transparent rounded-full blur-[130px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl w-full flex flex-col items-center space-y-8"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-800/[0.08] shadow-cozy">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-text-secondary font-medium">
              System Architecture & Methodology
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-text-primary leading-[1.12]">
            The Forensics Behind{" "}
            <span className="text-accent font-semibold">
              Audience Retention
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
            Traditional YouTube analytics tell you <span className="italic font-medium">that</span> viewers left, but never <span className="italic font-medium">why</span>. Cutpoint couples mathematical drop detection with Google Gemini 3.8 Flash multimodal video intelligence and Groq reasoning to turn opaque watch-time graphs into actionable editing prescriptions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs font-mono text-text-tertiary">
            <span className="px-2.5 py-1 rounded bg-white border border-stone-200 shadow-sm">
              8 Autonomous Agents
            </span>
            <span className="text-stone-300">•</span>
            <span className="px-2.5 py-1 rounded bg-white border border-stone-200 shadow-sm">
              Adversarial Debate
            </span>
            <span className="text-stone-300">•</span>
            <span className="px-2.5 py-1 rounded bg-white border border-stone-200 shadow-sm">
              Zero Prompt-Washing
            </span>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE 8-AGENT INVESTIGATION PIPELINE */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 border-t border-stone-800/[0.06] relative z-10 bg-white/40">
        <div className="max-w-5xl mx-auto space-y-16">
          <ScrollReveal direction="up">
            <SectionHeader
              eyebrow="Investigation Pipeline"
              title="Eight specialists. One verdict. Zero guesswork."
              subtitle="Every video retention anomaly undergoes an autonomous multi-stage investigation with dynamic dispatch, parallel visual and acoustic analysis, and adversarial cross-examination."
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <AgentPipelineVisual />
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: TECH STACK SHOWCASE */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 border-t border-stone-800/[0.06] relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          <ScrollReveal direction="up">
            <SectionHeader
              eyebrow="Production Stack"
              title="Engineered for speed, mathematical rigor, and zero hallucination."
              subtitle="Cutpoint bridges Google's multimodal Gemini models, Groq LPU inference, and SciPy calculus into a unified full-stack platform."
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <TechStackGrid />
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: BOTTOM CTA */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-8 py-20 sm:py-28 border-t border-stone-800/[0.06] relative z-10 bg-white/60">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-200/20 via-orange-100/30 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <ScrollReveal direction="up">
            <div className="space-y-4">
              <h2 className="font-heading text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">
                Ready to audit your retention?
              </h2>
              <p className="font-sans text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
                Connect your channel or analyze any video timeline with the 8-agent autonomous team.
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
                    {userEmail ? "Open Studio Dashboard" : "Experience Cutpoint"}
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
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
