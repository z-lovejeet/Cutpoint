"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className:
          "!bg-white !text-text-primary !border-black/[0.08] !shadow-dropdown !rounded-2xl !p-4 !font-sans !text-sm",
        duration: 3500,
        classNames: {
          toast: "border border-black/[0.08] bg-white shadow-dropdown text-text-primary",
          description: "text-text-secondary text-xs",
          actionButton: "bg-primary text-white rounded-lg text-xs font-medium px-3 py-1.5",
          cancelButton: "bg-neutral-100 text-text-secondary rounded-lg text-xs font-medium px-3 py-1.5",
          success: "!text-emerald-700 !border-emerald-200/80 !bg-emerald-50/70",
          error: "!text-red-700 !border-red-200/80 !bg-red-50/70",
          info: "!text-sky-700 !border-sky-200/80 !bg-sky-50/70",
          warning: "!text-amber-700 !border-amber-200/80 !bg-amber-50/70",
        },
      }}
    />
  );
}
