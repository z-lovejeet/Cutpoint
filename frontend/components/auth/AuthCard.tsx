"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-2xl glass-card border border-white/10 shadow-2xl shadow-black/80"
    >
      {/* Brand Icon Header */}
      <div className="flex flex-col items-center text-center space-y-2 mb-8">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-accent hover:bg-primary/20 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Cutpoint</span>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight pt-1">
          {title}
        </h1>
        <p className="text-sm text-text-secondary">{subtitle}</p>
      </div>

      {/* Main Content / Form */}
      {children}

      {/* Footer link */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-text-secondary">
        <span>{footerText} </span>
        <Link
          href={footerLinkHref}
          className="text-primary-light hover:text-accent font-medium underline underline-offset-4 transition-colors"
        >
          {footerLinkText}
        </Link>
      </div>
    </motion.div>
  );
}
