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
          base: "#FAF8F5", // Warm ivory parchment
          surface: "#FFFFFF", // Crisp porcelain white
          elevated: "#F3F0E8", // Warm bone/sand
          subtle: "#EAE5DC", // Warm stone
        },
        primary: {
          DEFAULT: "#18181B", // Deep obsidian noir
          light: "#27272A",
          dark: "#09090B",
          muted: "rgba(24, 24, 27, 0.06)",
        },
        accent: {
          DEFAULT: "#D95A2B", // Warm terracotta rust
          light: "#E86F42",
          dark: "#B8461B",
          muted: "rgba(217, 90, 43, 0.08)",
        },
        amber: {
          DEFAULT: "#D48828", // Editorial warm amber gold
          light: "#E49C3C",
          dark: "#B36F1C",
          muted: "rgba(212, 136, 40, 0.08)",
        },
        text: {
          primary: "#1C1917", // Warm stone obsidian
          secondary: "#57534E", // Editorial warm grey
          tertiary: "#78716C", // Muted taupe metadata
          disabled: "#A8A29E",
        },
        success: "#2D7A58", // Editorial sage green
        warning: "#D97706",
        danger: "#DC2626",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        cozy: "0 1px 2px 0 rgba(28, 25, 23, 0.04), 0 8px 24px -4px rgba(28, 25, 23, 0.04)",
        card: "0 1px 3px 0 rgba(28, 25, 23, 0.04), 0 16px 36px -6px rgba(28, 25, 23, 0.06)",
        dropdown: "0 4px 20px -2px rgba(28, 25, 23, 0.08), 0 16px 40px -4px rgba(28, 25, 23, 0.12)",
        "glow-subtle": "0 0 35px rgba(217, 90, 43, 0.12)",
        "glow-primary": "0 0 30px rgba(24, 24, 27, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
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
