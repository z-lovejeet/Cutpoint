# Cutpoint Design System

This is the central design system for **Cutpoint**, outlining our award-winning, premium, professional, clean, minimal, cozy, and 3D aesthetic. This document ensures visual consistency across all components and agents, serving as the blueprint for AI coding agents to implement the UI.

**Design Philosophy:**
- **Premium:** High-quality, polished interactions.
- **Professional:** Trustworthy, data-focused, serious but approachable.
- **Clean:** Minimalist, clutter-free interfaces.
- **Minimal:** Essential information only, intuitive hierarchy.
- **Cozy:** Warm, inviting dark mode rather than harsh black.
- **3D:** Subtle spatial depth, premium floating elements, non-obtrusive.

**Inspiration:** Vercel, Linear, Raycast, Stripe (dark mode, glassmorphism, subtle 3D, smooth animations).

---

## 1. Color System

Our color system uses a deeply cohesive dark mode palette, optimized for readability and a premium "hacker/analyst" vibe.

### Background Scale (Deep Space)
The foundation of the app is a deep, warm dark background. Not pure black.
- `bg-background-base`: `#0A0A0F` (Main application background)
- `bg-background-surface`: `#12121A` (Cards, panels, sidebars)
- `bg-background-elevated`: `#1A1A2E` (Dropdowns, modals, popovers)
- `bg-background-highlight`: `#22223A` (Hover states for elevated elements)

### Brand Colors
- **Primary (Electric Indigo):** `#6C63FF`
  - `primary-light`: `#8F88FF` (Hover state)
  - `primary-dark`: `#4A43D1` (Active/Pressed state)
  - `primary-muted`: `rgba(108, 99, 255, 0.2)` (Disabled or subtle backgrounds)
- **Accent (Cyan):** `#00D9FF`
  - `accent-light`: `#4DF0FF` (Hover state)
  - `accent-dark`: `#00A3CC` (Active state)
  - `accent-muted`: `rgba(0, 217, 255, 0.2)` (Glows and subtle backgrounds)

### Semantic Colors
Used for status, alerts, and feedback.
- **Success:** `#00E676` (Green)
- **Warning:** `#FFB300` (Amber)
- **Danger:** `#FF5252` (Red)
- **Info:** `#448AFF` (Blue)

### Typography Colors
- **Text Primary:** `#F5F5F7` (Headings, primary body text)
- **Text Secondary:** `#8888A0` (Subtitles, secondary information)
- **Text Tertiary:** `#555570` (Meta text, placeholders)
- **Text Disabled:** `#3A3A50` (Disabled states)

### Gradients
- **Brand Gradient:** `linear-gradient(135deg, #6C63FF 0%, #00D9FF 100%)`
- **Surface Gradient:** `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.0) 100%)`
- **Glow Effect:** `0 0 40px rgba(108, 99, 255, 0.3)`

---

## 2. Typography

A robust type system ensuring clarity, legibility, and a modern aesthetic.

### Font Families
- **Sans (Body):** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Display (Headings):** `Space Grotesk`, Inter, sans-serif
- **Mono (Code/Data):** `JetBrains Mono`, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace

### Setup with Next.js (`next/font`)
```typescript
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});
```

### Type Scale
- `text-xs`: 12px (0.75rem), line-height: 16px (1rem)
- `text-sm`: 14px (0.875rem), line-height: 20px (1.25rem)
- `text-base`: 16px (1rem), line-height: 24px (1.5rem)
- `text-lg`: 18px (1.125rem), line-height: 28px (1.75rem)
- `text-xl`: 20px (1.25rem), line-height: 28px (1.75rem)
- `text-2xl`: 24px (1.5rem), line-height: 32px (2rem)
- `text-3xl`: 30px (1.875rem), line-height: 36px (2.25rem)
- `text-4xl`: 36px (2.25rem), line-height: 40px (2.5rem)
- `text-5xl`: 48px (3rem), line-height: 1
- `text-6xl`: 60px (3.75rem), line-height: 1
- `text-7xl`: 72px (4.5rem), line-height: 1

### Font Weights
- Regular: `400`
- Medium: `500`
- Semibold: `600`
- Bold: `700`

### Line Heights
- Tight: `1.2`
- Snug: `1.375`
- Normal: `1.5`
- Relaxed: `1.625`

---

## 3. Spacing & Layout

A strict 4px base unit grid ensures visual rhythm and consistency.

### Spacing Scale
- `0`: 0px
- `1`: 4px (0.25rem)
- `2`: 8px (0.5rem)
- `3`: 12px (0.75rem)
- `4`: 16px (1rem)
- `5`: 20px (1.25rem)
- `6`: 24px (1.5rem)
- `8`: 32px (2rem)
- `10`: 40px (2.5rem)
- `12`: 48px (3rem)
- `16`: 64px (4rem)
- `20`: 80px (5rem)
- `24`: 96px (6rem)

### Container Max-Widths
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Padding Patterns
- **Section Padding:** `py-16 px-4 md:py-24 md:px-8`
- **Card Padding:** `p-6` (Standard), `p-8` (Large), `p-4` (Compact)

---

## 4. Component Styles (Tailwind)

Copy-pasteable Tailwind classes for standard UI components.

### Button
- **Primary:** `inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none bg-primary text-white hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] active:bg-primary-dark active:translate-y-0`
- **Secondary:** `inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none bg-surface/50 text-text-primary border border-white/10 hover:bg-surface hover:border-white/20 active:bg-elevated`
- **Ghost:** `inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 active:bg-white/10`
- **Danger:** `inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-danger/50 disabled:opacity-50 disabled:pointer-events-none bg-danger/10 text-danger hover:bg-danger/20 hover:text-red-400 active:bg-danger/30`
- **Sizes:**
  - Small (`sm`): `text-sm h-8 px-3 py-1`
  - Medium (`md`): `text-base h-10 px-4 py-2`
  - Large (`lg`): `text-lg h-12 px-6 py-3`

### Card (Glassmorphism)
- **Default:** `bg-[#12121A]/70 backdrop-blur-[20px] saturate-[180%] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-text-primary overflow-hidden`
- **Interactive (Hoverable):** `bg-[#12121A]/70 backdrop-blur-[20px] saturate-[180%] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-text-primary transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(108,99,255,0.15)] hover:-translate-y-1 cursor-pointer overflow-hidden`

### Input
- **Container:** `relative w-full flex flex-col gap-1`
- **Base Input:** `flex h-10 w-full rounded-lg border border-white/10 bg-background-elevated px-3 py-2 text-sm text-text-primary transition-all placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50`
- **Error State:** `border-danger focus:ring-danger/50 focus:border-danger text-danger`

### Badge
- **Base:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors`
- **Success:** `bg-success/10 text-success border border-success/20`
- **Warning:** `bg-warning/10 text-warning border border-warning/20`
- **Danger:** `bg-danger/10 text-danger border border-danger/20`
- **Info:** `bg-info/10 text-info border border-info/20`
- **Neutral:** `bg-surface text-text-secondary border border-white/10`

### Avatar
- **Base:** `relative flex shrink-0 overflow-hidden rounded-full border border-white/10 bg-elevated items-center justify-center`
- **Sizes:**
  - Small (`sm`): `h-8 w-8 text-xs`
  - Medium (`md`): `h-10 w-10 text-sm`
  - Large (`lg`): `h-12 w-12 text-base`

### Tooltip
- **Content:** `z-50 overflow-hidden rounded-md bg-elevated border border-white/10 px-3 py-1.5 text-xs text-text-primary shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2`

### Skeleton (Loading Placeholder)
- **Base:** `animate-pulse rounded-md bg-elevated`

### Chat Bubble
- **Container:** `flex w-full`
- **User (Right):** `ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-white shadow-md`
- **Assistant (Left):** `mr-auto max-w-[80%] rounded-2xl rounded-tl-sm bg-surface border border-white/5 px-4 py-3 text-sm text-text-primary shadow-sm`

### Health Indicator / Score Gauge
Used for retention metrics.
- **Red (0-40):** `text-danger drop-shadow-[0_0_8px_rgba(255,82,82,0.5)]`
- **Yellow (41-70):** `text-warning drop-shadow-[0_0_8px_rgba(255,179,0,0.5)]`
- **Green (71-100):** `text-success drop-shadow-[0_0_10px_rgba(0,230,118,0.5)]`

---

## 5. Glassmorphism System

Reusable classes for our signature glass look. Create a custom Tailwind utility or use these combinations.

```css
/* In global CSS or Tailwind components layer */
.glass-panel {
  @apply bg-[#12121A]/70 backdrop-blur-[20px] saturate-[180%] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)];
}

.glass-panel-interactive {
  @apply glass-panel transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(108,99,255,0.15)] hover:-translate-y-1;
}

.text-gradient {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent;
}
```

---

## 6. 3D Design Guidelines (React Three Fiber)

We use subtle 3D elements for a premium feel without overwhelming the user or causing performance issues.

### Base Canvas Setup
```tsx
import { Canvas } from '@react-three/fiber';
import { Environment, Float, OrbitControls } from '@react-three/drei';

export const ThreeCanvas = ({ children }) => (
  <Canvas 
    camera={{ fov: 45, position: [0, 0, 5] }}
    dpr={[1, 1.5]} // Limit pixel ratio for performance
    shadows={false} // Disable shadows for performance
    gl={{ antialias: true, alpha: true }}
    className="pointer-events-none" // Usually don't want it blocking UI
  >
    {/* Soft, premium lighting */}
    <ambientLight intensity={0.3} color="#6C63FF" />
    <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
    <pointLight position={[-5, -5, -5]} intensity={0.5} color="#00D9FF" />
    
    {children}
    
    {/* Optional: Environment for realistic reflections */}
    <Environment preset="city" blur={0.8} />
  </Canvas>
);
```

### Material Configuration
Use standard materials with a metallic, dark aesthetic.
```tsx
<meshStandardMaterial 
  color="#1A1A2E"
  metalness={0.6}
  roughness={0.2}
  envMapIntensity={1}
/>
```

### Floating Animation Pattern
Wrap objects in `<Float>` for a smooth hovering effect.
```tsx
<Float 
  speed={2} // Animation speed
  rotationIntensity={0.5} // XYZ rotation intensity
  floatIntensity={1} // Up/down float intensity
  floatingRange={[-0.1, 0.1]} // Range of y-axis values
>
  <mesh>...</mesh>
</Float>
```

---

## 7. Animation System

Smooth, purposeful animations enhance the premium feel.

### Framer Motion Variants
Define these reusable variants in a `lib/animations.ts` file or directly in components.

```typescript
export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};

export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

### CSS Transitions
Standardize transition timing for generic hover states.
`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`

---

## 8. Icon System

- **Library:** `lucide-react`
- **Usage:** Maintain consistent stroke width and sizing.
```tsx
import { BarChart2, TrendingDown, Info } from 'lucide-react';

// Small
<BarChart2 className="w-4 h-4 text-text-secondary" />

// Base
<TrendingDown className="w-5 h-5 text-danger" />

// Large
<Info className="w-6 h-6 text-info" />
```

---

## 9. Responsive Design

- **Mobile First:** Build for mobile layout first, then enhance for larger screens.
- **Breakpoints:**
  - `sm`: 640px (Mobile Landscape / Large Phones)
  - `md`: 768px (Tablets)
  - `lg`: 1024px (Small Laptops)
  - `xl`: 1280px (Desktops)
  - `2xl`: 1536px (Large Monitors)
- **3D Optimization:** Consider wrapping Canvas in a component that returns null on mobile devices if performance is an issue, or simplify geometry.

---

## 10. Tailwind Configuration

Use this exact configuration in `tailwind.config.ts`.

```typescript
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        },
        accent: {
          DEFAULT: "#00D9FF",
          light: "#4DF0FF",
          dark: "#00A3CC",
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
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        heading: ["var(--font-space-grotesk)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-jetbrains-mono)", ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 20px rgba(108, 99, 255, 0.4)',
        'glow-accent': '0 0 20px rgba(0, 217, 255, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```
