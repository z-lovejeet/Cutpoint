import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-stone-800/[0.06] bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-stone-800/[0.06]">
          {/* Left: Brand Identity */}
          <div className="space-y-3 max-w-md">
            <Logo href="/" size="md" />
            <p className="text-sm text-text-secondary leading-relaxed">
              Multimodal AI video retention forensics. Diagnose exactly why viewers drop off and prescribe surgical editing adjustments to hold attention.
            </p>
            <p className="text-xs font-mono text-text-tertiary">
              Built for the AI Content Engine Hackathon 2026
            </p>
          </div>

          {/* Right: Quick Links */}
          <div className="flex flex-wrap gap-10">
            <div className="space-y-3">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-text-tertiary">
                Product
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <Link href="/" className="hover:text-text-primary transition-colors">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-text-primary transition-colors">
                    About & Architecture
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-text-primary transition-colors">
                    Studio Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-text-tertiary">
                Open Source & Tech
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <a
                    href="https://github.com/z-lovejeet/Cutpoint"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-text-primary transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Repo</span>
                  </a>
                </li>
                <li className="text-xs font-mono text-text-tertiary">
                  Gemini 3.8 Flash • Groq
                </li>
                <li className="text-xs font-mono text-text-tertiary">
                  Supabase SSR • FastAPI
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary font-mono">
          <p>© {new Date().getFullYear()} Cutpoint. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Precision Video Forensics</span>
            <span>•</span>
            <span>Zero Hallucination Grounding</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
