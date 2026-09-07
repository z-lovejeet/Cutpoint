"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(open);
  const isControlled = onOpenChange !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a Dialog component");
  }
  return context;
}

export function DialogTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { onOpenChange } = useDialog();
  return (
    <div
      onClick={() => onOpenChange(true)}
      className={cn("inline-block cursor-pointer", className)}
    >
      {children}
    </div>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useDialog();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/35 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-2xl border border-black/[0.08] bg-white p-6 shadow-dropdown",
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-text-tertiary hover:bg-neutral-100 hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-5", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-heading text-xl font-bold tracking-tight text-text-primary",
        className
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-text-secondary leading-relaxed", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6",
        className
      )}
      {...props}
    />
  );
}
