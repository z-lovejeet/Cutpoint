import * as React from "react";
import AuthScene from "@/components/canvas/AuthScene";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-base relative overflow-hidden selection:bg-primary/10 selection:text-primary">
      <AuthScene />
      <div className="relative z-10 w-full max-w-md px-4 py-12">{children}</div>
    </div>
  );
}
