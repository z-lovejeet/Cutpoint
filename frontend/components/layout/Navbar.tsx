"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight, Menu, X, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    async function checkAuth() {
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
        console.warn("Navbar auth check failed:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800/[0.06] bg-[#FAF8F5]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo href="/" size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-stone-900 font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Overview
          </Link>
          <Link
            href="/about"
            className={`text-sm font-medium transition-colors ${
              pathname === "/about"
                ? "text-stone-900 font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            About
          </Link>
          <a
            href="https://github.com/z-lovejeet/Cutpoint"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoadingAuth ? (
            <div className="h-9 w-24 rounded-xl bg-stone-200/50 animate-pulse" />
          ) : userEmail ? (
            <Button variant="primary" size="sm" asChild className="rounded-xl px-4 py-2 text-xs font-mono font-medium shadow-sm bg-stone-900 text-stone-50 hover:bg-stone-800">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span>Studio Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="text-xs font-mono text-accent border-orange-200/90 bg-orange-50/70 hover:bg-orange-100/80 px-3 py-2 rounded-xl transition-all shadow-cozy flex items-center gap-1.5"
              >
                <Link href="/auth/guest">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Guest Demo</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs font-mono text-text-secondary hover:text-text-primary px-3.5 py-2 rounded-xl hover:bg-stone-900/[0.04] transition-all"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                variant="primary"
                size="sm"
                asChild
                className="text-xs font-mono font-medium px-4 py-2 rounded-xl shadow-sm bg-stone-900 text-stone-50 hover:bg-stone-800 hover:shadow-card flex items-center gap-1.5"
              >
                <Link href="/register">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-stone-100 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-stone-800/[0.06] bg-[#FAF8F5] px-4 py-6 space-y-4 shadow-dropdown overflow-hidden"
          >
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-stone-100 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/about"
                className="px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-stone-100 transition-colors"
              >
                About
              </Link>
              <a
                href="https://github.com/z-lovejeet/Cutpoint"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-stone-100 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
              </a>
            </div>

            <div className="pt-3 border-t border-stone-800/[0.06] flex flex-col space-y-2">
              {userEmail ? (
                <Button variant="primary" size="md" className="w-full bg-stone-900 text-stone-50" asChild>
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <span>Go to Studio Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="md" className="w-full text-accent border-orange-200/90 bg-orange-50/70" asChild>
                    <Link href="/auth/guest" className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>Guest Demo (No Login)</span>
                    </Link>
                  </Button>
                  <Button variant="secondary" size="md" className="w-full" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button variant="primary" size="md" className="w-full bg-stone-900 text-stone-50" asChild>
                    <Link href="/register" className="flex items-center justify-center gap-2">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
