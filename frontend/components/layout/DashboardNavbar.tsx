"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Globe,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { toast } from "@/components/ui/Toaster";

export interface DashboardNavbarProps {
  user: User;
  isGuest?: boolean;
}

export function DashboardNavbar({ user, isGuest = false }: DashboardNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Creator";

  const avatarUrl = user.user_metadata?.avatar_url || null;

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const res = await fetch("/auth/sign-out", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Signed out successfully");
        router.push("/sign-in");
        router.refresh();
      } else {
        toast.error("Failed to sign out. Please try again.");
        setIsSigningOut(false);
      }
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Network error while signing out");
      setIsSigningOut(false);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      active: pathname === "/dashboard",
    },
    {
      name: "New Analysis",
      href: "/dashboard/analyze",
      icon: <PlusCircle className="w-4 h-4" />,
      active: pathname === "/dashboard/analyze",
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <FileText className="w-4 h-4" />,
      active: pathname.startsWith("/dashboard/reports") || pathname.startsWith("/dashboard/report/"),
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-4 h-4" />,
      active: pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/profile"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-800/[0.06] bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: Studio Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <Logo size="md" variant="mark" />
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-bold text-text-primary tracking-tight">
                Cutpoint
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-100/70 text-accent font-semibold border border-orange-200/60">
                Studio
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Center-Aligned Navigation Tabs */}
        <nav className="hidden md:flex items-center justify-center flex-1 mx-4">
          <div className="flex items-center space-x-1 bg-stone-900/[0.04] p-1 rounded-2xl border border-stone-800/[0.06] shadow-inner">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  item.active
                    ? "text-stone-900 bg-white shadow-sm font-semibold border border-stone-200/80"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/60"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
                {item.active && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 left-3 right-3 h-[2px] bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right: Public Links (Overview, About), Status Badge & Profile Dropdown */}
        <div className="hidden md:flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1 border-r border-stone-800/[0.08] pr-3 mr-1 text-xs font-mono text-text-tertiary">
            <Link
              href="/"
              className="px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-stone-900/[0.04] transition-colors"
              title="Visit Public Landing Page"
            >
              Overview
            </Link>
            <Link
              href="/about"
              className="px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-stone-900/[0.04] transition-colors"
              title="Visit About Page"
            >
              About
            </Link>
          </div>

          {isGuest ? (
            <Badge variant="warning" dot className="hidden sm:inline-flex">
              <span>Guest Sandbox</span>
            </Badge>
          ) : (
            <Badge variant="success" dot className="hidden lg:inline-flex">
              <span>Synced</span>
            </Badge>
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-xl border border-black/[0.06] bg-white hover:bg-neutral-50 shadow-cozy transition-colors">
                <Avatar
                  src={avatarUrl}
                  fallback={displayName}
                  size="sm"
                  className="h-7 w-7 text-[11px]"
                />
                <span className="text-xs font-medium text-text-primary max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="right" width="w-60">
              <div className="p-3 border-b border-black/[0.06]">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-[11px] font-mono text-text-tertiary truncate">
                  {user.email}
                </p>
              </div>

              <div className="p-1">
                <DropdownMenuItem
                  icon={<UserIcon className="w-4 h-4" />}
                  onSelect={() => router.push("/dashboard/settings")}
                >
                  Profile &amp; Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  icon={<Globe className="w-4 h-4" />}
                  onSelect={() => router.push("/")}
                >
                  Public Landing Page
                </DropdownMenuItem>
                <DropdownMenuItem
                  icon={<Info className="w-4 h-4" />}
                  onSelect={() => router.push("/about")}
                >
                  About Methodology
                </DropdownMenuItem>
                <DropdownMenuItem
                  icon={<ExternalLink className="w-4 h-4" />}
                  onSelect={() => {
                    window.open("https://github.com/z-lovejeet/Cutpoint", "_blank");
                  }}
                >
                  GitHub Repository
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator />

              <div className="p-1">
                <DropdownMenuItem
                  destructive
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={handleSignOut}
                >
                  {isSigningOut ? "Exiting..." : isGuest ? "Exit Guest Mode" : "Sign Out"}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center space-x-2">
          <Avatar
            src={avatarUrl}
            fallback={displayName}
            size="sm"
            className="h-8 w-8 text-xs"
          />
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
            aria-label="Toggle mobile menu"
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
            className="md:hidden border-b border-black/[0.06] bg-white px-4 py-6 space-y-4 shadow-dropdown overflow-hidden"
          >
            {/* User Details */}
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-neutral-50 border border-black/[0.04]">
              <Avatar
                src={avatarUrl}
                fallback={displayName}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs font-mono text-text-tertiary truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    item.active
                      ? "text-accent bg-orange-50 font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}

              <div className="pt-2 border-t border-stone-800/[0.06] flex flex-col space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary"
                >
                  <Globe className="w-4 h-4 text-text-tertiary" />
                  <span>Public Landing Page</span>
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary"
                >
                  <Info className="w-4 h-4 text-text-tertiary" />
                  <span>About Cutpoint</span>
                </Link>
              </div>
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-3 border-t border-black/[0.06]">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-red-50 text-danger border border-red-200 text-sm font-medium hover:bg-red-100/70 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSigningOut ? "Exiting..." : isGuest ? "Exit Guest Mode" : "Sign Out"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
