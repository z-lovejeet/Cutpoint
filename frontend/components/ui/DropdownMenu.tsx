"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function useDropdown() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) {
    throw new Error("useDropdown must be used within a DropdownMenu");
  }
  return ctx;
}

export function DropdownMenuTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setOpen } = useDropdown();
  return (
    <div
      onClick={() => setOpen((prev) => !prev)}
      className={cn("inline-flex items-center cursor-pointer", className)}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuContentProps {
  align?: "left" | "right";
  width?: string;
  className?: string;
  children: React.ReactNode;
}

export function DropdownMenuContent({
  className,
  align = "right",
  width = "w-56",
  children,
}: DropdownMenuContentProps) {
  const { open } = useDropdown();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute z-50 mt-2 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-dropdown focus:outline-none",
            align === "right" ? "right-0" : "left-0",
            width,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface DropdownMenuItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  destructive?: boolean;
  icon?: React.ReactNode;
  onSelect?: () => void;
}

export function DropdownMenuItem({
  className,
  destructive = false,
  icon,
  children,
  onClick,
  onSelect,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdown();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    onSelect?.();
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-sans transition-colors outline-none",
        destructive
          ? "text-danger hover:bg-red-50 active:bg-red-100/80"
          : "text-text-primary hover:bg-black/[0.04] active:bg-black/[0.06]",
        className
      )}
      role="menuitem"
      {...props}
    >
      {icon && <span className="h-4 w-4 shrink-0 text-current">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1.5 h-px bg-black/[0.06]", className)}
      role="separator"
      {...props}
    />
  );
}
