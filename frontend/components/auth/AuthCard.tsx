"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-2xl bg-white border border-black/[0.07] shadow-card"
    >
      {/* Brand Icon Header */}
      <div className="flex flex-col items-center text-center space-y-2.5 mb-8">
        <Link
          href="/"
          className="group inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-50/70 border border-orange-200/80 text-xs font-mono text-accent-dark hover:bg-orange-100/70 transition-colors"
        >
          <Logo size={20} variant="mark" />
          <span>Cutpoint Studio</span>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-text-primary tracking-tight pt-1">
          {title}
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">{subtitle}</p>
      </div>

      {/* Main Form Content */}
      {children}

      {/* Footer link */}
      <div className="mt-8 pt-6 border-t border-stone-800/[0.06] text-center text-xs text-text-secondary">
        <span>{footerText}</span>{" "}
        <Link
          href={footerLinkHref}
          className="font-semibold text-stone-900 hover:text-accent hover:underline underline-offset-4 decoration-accent/40 transition-colors"
        >
          {footerLinkText}
        </Link>
      </div>
    </motion.div>
  );
}
