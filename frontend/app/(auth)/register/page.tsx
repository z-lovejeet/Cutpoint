"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import GitHubOAuthButton from "@/components/auth/GitHubOAuthButton";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      } else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccessMsg(
          "Account created! Please check your email inbox to confirm your account and get started."
        );
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Account"
      subtitle="Start diagnosing your video timelines and holding viewers longer"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/sign-in"
    >
      <div className="space-y-6">
        {/* GitHub OAuth */}
        <GitHubOAuthButton label="Sign up with GitHub" next="/dashboard" />

        {/* 1-Click Guest Pass for Judges */}
        <div className="pt-0.5">
          <Link
            href="/auth/guest?next=/dashboard"
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-accent/30 bg-orange-50/70 hover:bg-orange-100/80 text-accent font-medium text-xs font-mono shadow-cozy transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Enter as Guest (Judge &amp; Evaluator Sandbox)</span>
          </Link>
          <p className="text-[11px] font-mono text-text-tertiary text-center pt-1.5">
            1-click instant access without credentials or signup
          </p>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="flex-1 border-t border-black/[0.08]" />
          <span className="shrink-0 whitespace-nowrap bg-white px-3.5 text-[11px] font-mono uppercase tracking-wider text-text-tertiary select-none">
            Or continue with email
          </span>
          <div className="flex-1 border-t border-black/[0.08]" />
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-success/10 border border-success/20 text-success text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-text-secondary font-medium">
              Creator / Channel Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-base/60 border border-black/[0.09] text-text-primary placeholder:text-text-disabled text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-text-secondary font-medium">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@youtube.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-base/60 border border-black/[0.09] text-text-primary placeholder:text-text-disabled text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-text-secondary font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-base/60 border border-black/[0.09] text-text-primary placeholder:text-text-disabled text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <span>{isLoading ? "Creating Account..." : "Create Free Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
