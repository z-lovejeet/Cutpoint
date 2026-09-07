import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          base: "#F8F7F4", // Cozy warm linen
          surface: "#FFFFFF",
          elevated: "#F1EFEA",
          subtle: "#E9E7E1",
        },
        primary: {
          DEFAULT: "#4F46E5", // Elegant indigo
          light: "#6366F1",
          dark: "#3730A3",
          muted: "rgba(79, 70, 229, 0.08)",
        },
        accent: {
          DEFAULT: "#0284C7", // Sky cyan
          light: "#38BDF8",
          dark: "#0369A1",
          muted: "rgba(2, 132, 199, 0.08)",
        },
        text: {
          primary: "#18181B", // Deep slate / obsidian
          secondary: "#52525B", // Neutral grey
          tertiary: "#71717A", // Muted metadata
          disabled: "#A1A1AA",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        cozy: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 12px 32px -4px rgba(24, 24, 27, 0.06)",
        dropdown: "0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 12px 40px -4px rgba(0, 0, 0, 0.12)",
        "glow-subtle": "0 0 30px rgba(79, 70, 229, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
