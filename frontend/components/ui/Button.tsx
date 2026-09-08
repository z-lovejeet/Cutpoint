"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-light active:bg-primary-dark hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 border border-stone-800",
  accent:
    "bg-accent text-white shadow-sm hover:bg-accent-light active:bg-accent-dark hover:shadow-glow-subtle hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 border border-accent-dark/30",
  secondary:
    "bg-white text-text-primary border border-stone-300/80 shadow-cozy hover:bg-stone-50 active:bg-stone-100 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-stone-900/[0.04] active:bg-stone-900/[0.07]",
  danger:
    "bg-red-50 text-danger border border-red-200 hover:bg-red-100/80 active:bg-red-200 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0",
  outline:
    "border border-stone-300 text-text-primary bg-transparent hover:bg-stone-100/70 active:bg-stone-200/50",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-4 text-xs rounded-lg gap-2",
  md: "h-10 px-5 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-base rounded-lg gap-2.5",
  icon: "h-9 w-9 p-0 rounded-lg justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const combinedClasses = cn(
      "inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 active:scale-[0.97] hover:scale-[1.02] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    if (asChild) {
      return (
        <Slot ref={ref} className={combinedClasses} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading ? (
          <>
            <CircleLoader size={size === "sm" ? "xs" : "sm"} centerDot={false} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="inline-flex shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
