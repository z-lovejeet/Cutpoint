import * as React from "react";
import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Cutpoint — AI Video Retention Forensics for Creators",
  description:
    "Pinpoint the exact second you lost them. Cutpoint couples mathematical drop detection with Google Gemini 3.8 Flash multimodal video intelligence to turn watch time curves into actionable editing prescriptions.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Cutpoint — AI Video Retention Forensics",
    description:
      "Multimodal AI video retention intelligence. Diagnose why viewers drop off and prescribe surgical editing adjustments.",
    images: ["/logo-bg.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background-base text-text-primary antialiased selection:bg-primary/10 selection:text-primary">
        <React.Suspense fallback={null}>
          <TopProgressBar />
        </React.Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
