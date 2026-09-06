# UI/UX Specification: Cutpoint

**Project Name:** Cutpoint
**Design Philosophy:** Premium, Professional, Clean, Minimal, Cozy, 3D — Award-winning aesthetic. NOT AI slop.

This document serves as the comprehensive source of truth for all frontend interfaces, components, 3D elements, animations, and design tokens for the Cutpoint platform.

---

## 1. Design Tokens

The foundational visual elements that ensure consistency across the application.

### 1.1 Colors

All colors are defined as hex values and CSS custom properties (variables) in the global stylesheet.

*   **Background:** `#0A0A0F` - Deep space black. The primary background color.
*   **Surface:** `#12121A` - Slightly elevated surface color for cards and modals.
*   **Surface Hover:** `#1A1A2E` - Hover state for surface elements.
*   **Primary:** `#6C63FF` - Electric indigo. Used for primary CTAs, links, and active states.
*   **Primary Glow:** `#6C63FF40` - Used for box-shadows on primary elements to create a neon glow effect.
*   **Accent:** `#00D9FF` - Cyan. Used for secondary emphasis and 3D lighting highlights.
*   **Success:** `#00E676` - Green. Indicates positive health, successful actions, and growth.
*   **Warning:** `#FFB300` - Amber. Indicates caution, moderate drop-offs.
*   **Danger:** `#FF5252` - Red. Indicates severe cliffs, errors, and destructive actions.
*   **Text Primary:** `#F5F5F7` - Off-white for maximum readability against dark backgrounds.
*   **Text Secondary:** `#8888A0` - Muted text for labels, descriptions, and less important information.

### 1.2 Typography

We use three distinct fonts to create hierarchy and technical feel.

*   **Body (Default):** `Inter` - Used for all general text, paragraphs, and standard UI elements.
    *   Base size: `16px`
    *   Line height: `1.5`
    *   Weights: `400` (Regular), `500` (Medium), `600` (Semi-bold)
*   **Headings:** `Space Grotesk` - Used for all H1-H6 elements to provide a modern, tech-forward aesthetic.
    *   Weights: `500` (Medium), `700` (Bold)
    *   Letter spacing: `-0.02em`
*   **Data & Code:** `JetBrains Mono` - Used exclusively for tabular data, numbers, statistics, and code blocks.
    *   Weights: `400` (Regular)

### 1.3 Spacing System

Based on a 4px grid. All padding, margins, and gaps must use these multiples.

*   `4px` - 3xs
*   `8px` - 2xs
*   `12px` - xs
*   `16px` - sm (Base component padding)
*   `24px` - md
*   `32px` - lg (Section gaps)
*   `48px` - xl
*   `64px` - 2xl
*   `96px` - 3xl (Page layout margins)

### 1.4 Border Radius

*   `8px` (sm) - Buttons, small inputs, tooltips.
*   `12px` (md) - Cards, dropdown menus, smaller container panels.
*   `16px` (lg) - Modals, main layout containers, feature blocks.
*   `9999px` (pill) - Badges, circular avatars, round buttons.

### 1.5 Shadows & Effects

The core aesthetic relies heavily on glassmorphism and subtle glows.

*   **Glass Panel:**
    *   `background: rgba(18, 18, 26, 0.6)`
    *   `backdrop-filter: blur(20px)`
    *   `border: 1px solid rgba(255, 255, 255, 0.08)`
*   **Primary Glow:**
    *   `box-shadow: 0 0 20px 0 rgba(108, 99, 255, 0.4)`
*   **Subtle Elevation:**
    *   `box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.5)`

### 1.6 Animation Curves

*   **Default Spring (Framer Motion):** `type: "spring", stiffness: 400, damping: 30`
*   **Smooth CSS Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` - Fast start, slow end. Used for transitions, hovers.

---

## 2. Page Specifications

### 2.a Landing Page (Home)

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Logo]                           [About] [Sign In] [Get Started]|
+-------------------------------------------------------------+
|                                                             |
|                       Hero Section                          |
|                                                             |
|  Stop guessing why viewers leave. Start knowing.            |
|  [Connect YouTube]                                          |
|                                                             |
|  (3D Floating Retention Graph in Background)                |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                       The Problem                           |
|  (Visual showing a typical confusing analytics dashboard)   |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                       How It Works                          |
|  1. Pull Data -> 2. Detect Cliffs -> 3. AI Analysis         |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                       Features                              |
|  [Feature 1]  [Feature 2]  [Feature 3]                      |
|                                                             |
+-------------------------------------------------------------+
|                       Testimonials                          |
|  "This saved my channel" - Creator                          |
+-------------------------------------------------------------+
|                       Footer / CTA                          |
+-------------------------------------------------------------+
```

**Components:**
*   `Navigation`: Sticky header with glassmorphism.
*   `Hero`: H1 (Space Grotesk), subtitle, Primary CTA button.
*   `FeatureCard`: Glass panel with icon, title, text.
*   `TestimonialCard`: Avatar, quote, author.

**3D Elements:**
*   A massive, stylized, floating line graph representing retention in the hero section. Made of glowing particles or a glowing mesh using `react-three-fiber` and `drei`. It slowly rotates and undulates.

**Animations (GSAP ScrollTrigger):**
*   **Hero:** Text elements stagger-fade-up on load. 3D graph scales in.
*   **Scroll:** As user scrolls down, the 3D graph moves to the side or morphs into different shapes to accompany the text sections.
*   **Sections:** Sections fade-up and slide-in as they enter the viewport.

**Data Requirements:** Static content, links to Auth.

### 2.b About Page

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Header Navigation]                                         |
+-------------------------------------------------------------+
|                                                             |
|                  The Mission                                |
|  We want to give creators enterprise-grade AI forensics.    |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                  The Architecture                           |
|  (3D Pipeline Visualization showing 5 Agents)               |
|                                                             |
+-------------------------------------------------------------+
|                  Tech Stack                                 |
|  [Next.js] [FastAPI] [Gemini] [Groq] [Supabase]             |
+-------------------------------------------------------------+
```

**Components:**
*   `MissionStatement`: Large typography.
*   `TechIconGrid`: Grid of glowing logos.
*   `TeamProfile`: Photo, name, role.

**3D Elements:**
*   A 3D visualization of data flowing through 5 distinct nodes (representing the 5 AI agents). Small glowing orbs moving along tubes to represent data transfer.

**Animations:**
*   The 3D pipeline runs continuously.
*   Tech stack icons float subtly on hover.

### 2.c Sign In Page

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Header (Minimal)]                                          |
+-------------------------------------------------------------+
|                                                             |
|             +---------------------------------+             |
|             |          Welcome Back           |             |
|             |  [Google OAuth Button]          |             |
|             |          - OR -                 |             |
|             |  Email: [______________]        |             |
|             |  Pass:  [______________]        |             |
|             |  [Sign In]                      |             |
|             |                                 |             |
|             |  Don't have an account? [Reg]   |             |
|             +---------------------------------+             |
|                                                             |
|  (Subtle 3D Background - Ambient Orbs)                      |
+-------------------------------------------------------------+
```

**Components:**
*   `AuthCard`: Glassmorphic container (`backdrop-blur`).
*   `OAuthButton`: Google logo, white background (to adhere to branding), dark text.
*   `TextInput`: Dark background (`#1A1A2E`), border changing to Primary on focus.
*   `SubmitButton`: Primary color, full width.

**3D Elements:**
*   Very subtle, slow-moving, blurred 3D spheres in the background using `MeshPhysicalMaterial` with high transmission (glass-like) catching colored lights (Primary and Accent).

**Animations:**
*   `AuthCard` slides up and fades in on page load (Framer Motion).
*   Form input validation shake on error.

### 2.d Register Page

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Header (Minimal)]                                          |
+-------------------------------------------------------------+
|                                                             |
|             +---------------------------------+             |
|             |          Create Account         |             |
|             |  [Google OAuth Button]          |             |
|             |          - OR -                 |             |
|             |  Name:  [______________]        |             |
|             |  Email: [______________]        |             |
|             |  Pass:  [______________]        |             |
|             |  [Register]                     |             |
|             |                                 |             |
|             |  Already have an account? [Sign]|             |
|             +---------------------------------+             |
|                                                             |
+-------------------------------------------------------------+
```

**Components & 3D:** Same as Sign In.

**Animations:**
*   Successful registration triggers a smooth Framer Motion `layoutId` transition where the card expands to fill the screen, revealing the Dashboard.

### 2.e Dashboard Page

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Sidebar] |  Dashboard                              [User]  |
| - Home    |                                                 |
| - Vids    |  +------------+  +-------------+  +----------+  |
| - Profile |  | Total Vids |  | Avg Health  |  | Top Vid  |  |
|           |  | 142        |  | 84%         |  | "Vlog"   |  |
|           |  +------------+  +-------------+  +----------+  |
|           |                                                 |
|           |  Recent Analyses                                |
|           |  +------------------------------------------+   |
|           |  | Thumbnail | Title       | Date | Score   |   |
|           |  | [Img]     | My Video 1  | 9/6  | 92 (G)  |   |
|           |  | [Img]     | My Video 2  | 9/5  | 45 (R)  |   |
|           |  +------------------------------------------+   |
+-------------------------------------------------------------+
```

**Components:**
*   `Sidebar`: Navigation links, active state uses Primary color and subtle glow.
*   `StatCard`: Glassmorphic, contains number (JetBrains Mono) and label.
*   `VideoTable`/`VideoGrid`: Displays YouTube thumbnail, title, analysis date, and health score badge (Red/Yellow/Green based on value).

**3D Elements:**
*   Optional: `StatCard`s can have a subtle 3D tilt effect on mouse move using `react-three/drei`'s `<PresentationControls>` or a custom hover calculation for CSS transforms.

**Animations:**
*   Dashboard widgets stagger-fade-in on mount.
*   Hovering over table rows changes background to `Surface Hover`.

**Data Requirements:** User data, Channel summary stats, list of past analyses from Supabase.

### 2.f Analysis Page

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Sidebar] |  New Analysis                                   |
|           |                                                 |
|           |  Select Video to Analyze:                       |
|           |  [ Search your channel... (Dropdown) v ]        |
|           |                                                 |
|           |  - OR -                                         |
|           |                                                 |
|           |  [ Drag and Drop Video File Here ]              |
|           |                                                 |
|           |  [ RUN FORENSICS (Button) ]                     |
|           |                                                 |
|           |  (Progress visual appears here when running)    |
|           |  [Agent 1] -> [Agent 2] -> [Agent 3]            |
+-------------------------------------------------------------+
```

**Components:**
*   `VideoSelect`: Combobox/Autocomplete fetching from YouTube Data API.
*   `Dropzone`: Dashed border, changes color on drag-over.
*   `PrimaryCTA`: Large, pulsating button when ready.
*   `AgentProgress`: Stepper component showing the 5 stages.

**3D Elements:**
*   While analysis is running, show a 3D visual of the agents working (e.g., glowing cubes lighting up in sequence representing the Python asyncio tasks).

**Animations:**
*   `AgentProgress` stages light up (Primary color) smoothly as backend updates are received (e.g., via WebSocket or polling).
*   Loading spinner inside the button.

### 2.g Report Page

**Layout:**
```ascii
+-------------------------------------------------------------+
| [Sidebar] |  Forensic Report: "Video Title"                 |
|           |                                                 |
|           |  +-------------------------+ +---------------+  |
|           |  | Executive Summary       | | Health Score  |  |
|           |  | The intro is great, but | |    (85)       |  |
|           |  | pacing drops at 3:12... | |    Great!     |  |
|           |  +-------------------------+ +---------------+  |
|           |                                                 |
|           |  Retention Chart (Recharts)                     |
|           |  |    *                                         |
|           |  |   / \                                        |
|           |  |  /   \     * <--(Cliff Marker)               |
|           |  | /     \___/ \                                |
|           |  +-------------------------------------------   |
|           |                                                 |
|           |  Cliff Analysis (Timestamp 3:12)                |
|           |  +------------------------------------------+   |
|           |  | Visual: Scene darkens. Audio: Muffled.   |   |
|           |  | AI: "User lost context due to..."        |   |
|           |  +------------------------------------------+   |
|           |                                                 |
|           |                                       [CHAT] <--|
+-------------------------------------------------------------+
```

**Components:**
*   `SummaryCard`: Text from Agent 4 (Groq 20B).
*   `HealthGauge`: Circular SVG or Recharts radial bar.
*   `RetentionChart`: Recharts `LineChart`. Custom customized dot for "cliffs" detected by Agent 2.
*   `CliffCard`: Accordion/expandable card showing Gemini 3.8 Flash's analysis for that specific timestamp.
*   `ChatPopupButton`: Floating Action Button (FAB).

**3D Elements:**
*   The `HealthGauge` can be a 3D torus rendered in R3F that fills up based on the score.

**Animations:**
*   `RetentionChart` line draws itself on load (animation duration: 1.5s).
*   `CliffCard` expand/collapse uses Framer Motion `AnimatePresence` for smooth height interpolation.

---

## 3. Chat Popup Component

The Chat Agent (Agent 5 - Groq 120B) interface for interacting with the report.

**Design:**
*   **Collapsed:** 56x56px circular button in the bottom right. Color: Primary `#6C63FF`. Icon: Sparkles or Chat Bubble. `box-shadow` for floating effect.
*   **Expanded:** 400px width x 600px height glassmorphic panel (`backdrop-blur(20px)`, `background: rgba(18, 18, 26, 0.8)`).
*   **Header:** "Ask AI about this report". Contains a close/minimize button.
*   **Message List:** Scrollable area.
    *   `User Bubble`: Right-aligned, Background: `Surface Hover`.
    *   `AI Bubble`: Left-aligned, Background: transparent, Border-left: 2px solid Primary. Uses Markdown rendering for lists/code.
*   **Input Area:** Text input with submit icon button.

**Animations (Framer Motion):**
```javascript
const panelVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50, transformOrigin: "bottom right" },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25 } }
};
```
*   Typing indicator: Three bouncing dots (CSS animation).
*   Auto-scroll: Smooth scroll to bottom when new messages arrive.

---

## 4. 3D Elements Specification (React Three Fiber)

All 3D scenes must be dynamically imported to prevent server-side rendering issues in Next.js.
```javascript
const DynamicScene = dynamic(() => import('./Scene'), { ssr: false })
```

### 4.1 Hero Graph Scene
*   **Canvas:** Full screen, absolute positioning, z-index -1.
*   **Camera:** `PerspectiveCamera`, FOV 45, Position `[0, 2, 10]`.
*   **Lighting:**
    *   `ambientLight` intensity 0.5.
    *   `directionalLight` position `[10, 10, 5]` intensity 1.
    *   `pointLight` color `#6C63FF` (Primary) position `[-5, 0, 5]` to create the glow.
*   **Geometry:** A `TubeGeometry` built from a `CatmullRomCurve3` based on mock retention data.
*   **Material:** `MeshStandardMaterial` with `emissive="#6C63FF"`, `emissiveIntensity={0.5}`, `roughness={0.2}`, `metalness={0.8}`. Use `@react-three/postprocessing` `Bloom` for the neon effect.
*   **Animation:** `useFrame((state) => { ref.current.rotation.y = state.clock.elapsedTime * 0.1; })`

### 4.2 Pipeline Nodes Scene
*   **Geometry:** 5 `SphereGeometry` nodes connected by `CylinderGeometry` tubes.
*   **Material:** Nodes use `MeshPhysicalMaterial` (glass-like).
*   **Animation:** Use GSAP to animate a glowing point light moving along the path of the tubes to simulate data flow.

---

## 5. Animation Specifications

*   **Page Transitions:**
    *   Wrap Next.js pages in `<AnimatePresence mode="wait">`.
    *   Enter: `opacity: 0, y: 20` -> `opacity: 1, y: 0`.
    *   Exit: `opacity: 0, y: -20`.
    *   Duration: 0.3s, Easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
*   **Scroll Reveals (GSAP):**
    *   Use `ScrollTrigger.batch()` for grids/lists to stagger elements as they scroll into view.
    *   `y: 50, opacity: 0` -> `y: 0, opacity: 1`.
*   **Hovers:**
    *   Buttons: `scale: 1.05`, increase `box-shadow` opacity.
    *   Cards: `translateY: -4px`, background color shift.
*   **Loading States:**
    *   Use skeleton screens with a shimmer effect (CSS linear-gradient animation sweeping left to right) instead of spinners for data fetching.

---

## 6. Responsive Breakpoints

*   **Mobile (`< 768px`):**
    *   Grid columns go to `1fr`.
    *   Sidebar collapses into a Hamburger menu (Drawer component).
    *   3D scenes are completely hidden (render `null`) to save battery and performance, replaced with high-quality WebP static images.
    *   Typography scales down (e.g., H1 from 64px to 40px).
    *   Padding reduces to `16px` on page edges.
*   **Tablet (`768px - 1024px`):**
    *   Grid columns usually `2fr`.
    *   Sidebar can be icon-only to save space.
    *   3D scenes enabled but with lower resolution/post-processing disabled.
*   **Desktop (`> 1024px`):**
    *   Full layout as designed.
    *   Max-width containers applied (e.g., `1200px` or `1440px`) to prevent infinite stretching on ultrawide monitors.

---

## 7. Accessibility

*   **Color Contrast:** All text (`Text Primary` and `Text Secondary`) must pass WCAG AA contrast ratio (4.5:1) against `Background` and `Surface` colors.
*   **Keyboard Navigation:** All interactive elements (buttons, links, inputs) must be focusable.
    *   Focus state styling: `outline: 2px solid #00D9FF; outline-offset: 2px;`.
*   **Screen Readers:**
    *   Provide `aria-labels` for icon-only buttons (like the Chat FAB or sidebar icons).
    *   Use semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`).
    *   3D canvases must have a visually hidden fallback text or `aria-label` describing what the 3D visual represents.
*   **Reduced Motion:**
    *   Check for `prefers-reduced-motion` media query.
    *   If true, disable GSAP scroll triggers, simplify Framer Motion page transitions to just `opacity` (no `y` translation), and stop continuous 3D rotations.

---
*(End of UI/UX Specification)*
