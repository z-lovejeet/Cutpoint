import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: {
          base: "#0A0A0F",
          surface: "#12121A",
          elevated: "#1A1A2E",
          highlight: "#22223A",
        },
        primary: {
          DEFAULT: "#6C63FF",
          light: "#8F88FF",
          dark: "#4A43D1",
          muted: "rgba(108, 99, 255, 0.2)",
        },
        accent: {
          DEFAULT: "#00D9FF",
          light: "#4DF0FF",
          dark: "#00A3CC",
          muted: "rgba(0, 217, 255, 0.2)",
        },
        text: {
          primary: "#F5F5F7",
          secondary: "#8888A0",
          tertiary: "#555570",
          disabled: "#3A3A50",
        },
        success: "#00E676",
        warning: "#FFB300",
        danger: "#FF5252",
        info: "#448AFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glow-primary": "0 0 24px rgba(108, 99, 255, 0.35)",
        "glow-accent": "0 0 24px rgba(0, 217, 255, 0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
