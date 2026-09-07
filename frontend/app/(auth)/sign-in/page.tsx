"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import GoogleOAuthButton from "@/components/auth/GoogleOAuthButton";

const AuthScene = dynamic(() => import("@/components/canvas/AuthScene"), {
  ssr: false,
});

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam ? "Authentication session could not be completed. Please try again." : null
  );

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      } else {
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during sign-in.";
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-background-base overflow-hidden">
      <AuthScene />

      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to your studio to analyze your viewer retention drops"
        footerText="Don't have a Cutpoint account?"
        footerLinkText="Create one here"
        footerLinkHref="/register"
      >
        <div className="space-y-6">
          {/* Google OAuth */}
          <GoogleOAuthButton next={next} label="Sign in with Google" />

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-black/[0.08]" />
            <span className="bg-white px-3 text-[11px] font-mono uppercase text-text-tertiary">
              Or with email
            </span>
            <div className="w-full border-t border-black/[0.08]" />
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-medium">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-base/60 border border-black/[0.09] text-text-primary placeholder:text-text-disabled text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-60"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to Studio"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </AuthCard>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-base text-text-tertiary font-mono text-xs">
          Loading sign in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
