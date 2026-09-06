# Development Roadmap: Cutpoint

This document outlines the logical phases of development for the **Cutpoint** project. It serves as the primary blueprint for building the application, ensuring that dependencies are respected and that the core pipeline is constructed systematically.

---

## Phase 1: Project Foundation

This phase establishes the foundational architecture, monorepo structure, and core configurations required for all subsequent development.

### Detailed Task List
- **Monorepo Setup:**
  - Create root directory structure: `frontend/`, `backend/`, `docs/`, `shared/`, `docker/`.
  - Initialize Git repository and configure root `.gitignore`.
- **Frontend Initialization (Next.js):**
  - Initialize Next.js 15 project in `frontend/` using App Router and TypeScript.
  - Install dependencies: `react`, `react-dom`, `next`, `typescript`, `@types/react`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`, `@supabase/ssr`, `@supabase/supabase-js`, `recharts`, `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`.
  - Configure `tailwind.config.ts` with custom design tokens (Deep space black `#0A0A0F`, Electric indigo `#6C63FF`, Cyan `#00D9FF`).
  - Set up Shadcn/ui CLI and initialize components directory. Customize `globals.css` with the deep space theme variables.
  - Configure ESLint and Prettier for the frontend workspace.
- **Backend Initialization (Python FastAPI):**
  - Initialize Python project in `backend/` using `uv`.
  - Create `pyproject.toml` and `uv.lock`.
  - Install dependencies: `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `google-genai`, `groq`, `google-api-python-client`, `google-auth-httplib2`, `google-auth-oauthlib`, `supabase`, `numpy`, `scipy`, `httpx`, `python-dotenv`, `pytest`, `black`, `isort`, `mypy`.
  - Configure `black`, `isort`, and `mypy` in `pyproject.toml`.
  - Create base FastAPI app structure: `main.py`, `api/`, `core/`, `agents/`, `services/`, `models/`.
- **Infrastructure & Config:**
  - Create `.env.example` defining all required environment variables for both frontend and backend.
  - Set up `docker-compose.yml` for local development (PostgreSQL mock, Redis if needed, FastAPI container, Next.js container).
  - Create `Makefile` with targets: `install`, `dev-front`, `dev-back`, `dev-all`, `lint`, `test`.

### Dependencies
- None. This is the starting point.

### Deliverables
- Functional monorepo structure.
- Next.js 15 frontend running on `localhost:3000`.
- FastAPI backend running on `localhost:8000` with interactive docs (`/docs`).
- Configured linters, formatters, and Docker environment.

### Testing Criteria
- `make dev-all` successfully launches both servers without errors.
- Code changes trigger hot-reloads on both frontend and backend.
- Linters pass with zero warnings on initial empty templates.

---

## Phase 2: Authentication & Database

This phase implements secure user authentication and establishes the PostgreSQL database schema using Supabase.

### Detailed Task List
- **Supabase Project Setup:**
  - Create new project in Supabase dashboard.
  - Configure Google OAuth provider in Authentication settings (requires GCP credentials).
- **Database Schema & Migrations:**
  - Write SQL migrations for tables:
    - `profiles` (id references auth.users, full_name, avatar_url, updated_at)
    - `youtube_channels` (id, user_id, channel_id, channel_name, access_token, refresh_token, token_expiry)
    - `analyses` (id, user_id, video_id, status, error_message, created_at, updated_at)
    - `chat_messages` (id, analysis_id, user_id, role, content, created_at)
  - Define Row-Level Security (RLS) policies enforcing `auth.uid() = user_id` for all operations.
  - Execute migrations using Supabase CLI.
- **Next.js Auth Integration (@supabase/ssr):**
  - Implement `utils/supabase/server.ts` and `utils/supabase/client.ts`.
  - Create `middleware.ts` to manage session refresh and route protection.
  - Build Auth Context Provider for client-side session state management.
- **Auth Pages & UI:**
  - Build **Sign In Page** (`/sign-in`): Email/password form + "Continue with Google" button.
  - Build **Register Page** (`/register`): Email/password form + Google OAuth button.
  - Implement `/auth/callback` route handler for OAuth code exchange.

### Dependencies
- Phase 1 (Project Foundation)

### Deliverables
- Supabase project configured with Google OAuth.
- Database tables created with strict RLS policies.
- Fully functional authentication flow in Next.js (Sign Up, Sign In, Sign Out).
- Protected dashboard route.

### Testing Criteria
- New user can register via Email/Password.
- User can sign in using Google OAuth.
- Invalid credentials return graceful error messages.
- Accessing `/dashboard` while logged out redirects to `/sign-in`.
- Accessing `/dashboard` while logged in succeeds.

---

## Phase 3: Design System & Layout

This phase builds the visual foundation, translating the award-winning 3D aesthetic into reusable UI components.

### Detailed Task List
- **Core Layout & Theming:**
  - Implement `app/layout.tsx` with Inter font for body, Space Grotesk for headings, JetBrains Mono for data.
  - Enforce global dark theme (deep space black `#0A0A0F`).
  - Implement glassmorphism utility classes (`backdrop-filter: blur(20px)`, subtle borders).
- **Reusable UI Components (Shadcn/ui + Custom):**
  - `Button`: Variants (primary indigo, secondary ghost, danger, glowing).
  - `Card`: Glassmorphic container with neon accents on hover.
  - `Input` & `Label`: Styled form elements with focus states.
  - `Badge`: For status indicators (e.g., "Analyzing", "Completed", "Error").
  - `Avatar`: User profile image display.
  - `DropdownMenu`: For user settings and actions.
  - `Modal` / `Dialog`: For confirmations and detailed views.
  - `Toast` / `Sonner`: Global notification system.
- **Animation Wrappers:**
  - Set up Framer Motion `AnimatePresence` and page transition wrapper component.
- **Navigation Components:**
  - `Navbar`: Transparent fixed header for public pages.
  - `Sidebar`: Collapsible navigation for the Dashboard area.
  - `Footer`: Minimal footer for public pages.
- **React Three Fiber Setup:**
  - Create a utility wrapper for `<Canvas>` to enable dynamic importing (`ssr: false`).
  - Set up standard lighting (ambient, directional) and post-processing (bloom) components.

### Dependencies
- Phase 1 (Project Foundation)

### Deliverables
- Comprehensive set of styled, interactive UI components.
- Global layout structure for public and protected routes.
- R3F configuration ready for 3D asset injection.

### Testing Criteria
- Storybook or a temporary `/ui-test` page confirms all components render correctly in dark mode.
- Framer motion transitions fire smoothly between routes.
- Mobile responsiveness holds up for Navbar and Sidebar.

---

## Phase 4: Landing Page & Public Pages

This phase constructs the public-facing marketing pages designed to attract users and showcase the technology.

### Detailed Task List
- **Landing Page (`/`):**
  - **Hero Section:** Integrate React Three Fiber canvas displaying a floating, abstract retention graph. Add large typography and primary CTA ("Start Analyzing").
  - **Problem Statement:** Text-heavy section utilizing GSAP ScrollTrigger to reveal striking statistics about audience drop-off.
  - **How it Works:** 3-step visual pipeline layout. Use scroll-linked animations to activate each step sequentially.
  - **Features Showcase:** Bento-box grid layout highlighting Multimodal AI, Math-based cliff detection, and Chat interactions.
  - **Bottom CTA:** Final push to sign up.
- **About Page (`/about`):**
  - Detailed explanation of the 5-agent pipeline.
  - Tech stack showcase with interactive hover states on logos.
- **Responsive Polish:**
  - Ensure 3D canvas degrades gracefully on low-power devices.
  - Adjust grid layouts and font sizes for mobile screens.

### Dependencies
- Phase 3 (Design System & Layout)

### Deliverables
- Stunning, animated Landing Page.
- Informative About Page.

### Testing Criteria
- GSAP animations trigger correctly upon scrolling into view.
- 3D elements render at 60fps on desktop browsers.
- No horizontal scrolling bugs on mobile devices.

---

## Phase 5: Backend Agents — Core Pipeline

This is the most critical backend phase, implementing the core AI and data processing logic using parallel execution.

### Detailed Task List
- **Data Models (Pydantic):**
  - Implement `VideoMetadata`, `RetentionDataPoint`, `CliffPoint`, `AgentResponse`, `ForensicReport` schemas.
- **Agent 1: Data Fetcher:**
  - Implement YouTube Data API client to fetch video metadata (title, duration, thumbnails).
  - Implement YouTube Analytics API client to retrieve `audienceWatchRatio` time-series data.
  - Handle OAuth token refresh logic.
- **Agent 2: Cliff Detector (Math):**
  - Process time-series data using NumPy.
  - Calculate first derivative to find the rate of change.
  - Apply thresholding and SciPy peak detection to identify the sharpest negative gradients (cliffs).
  - Categorize cliffs by severity (High, Medium, Low).
- **Agent 3: Video Analyzer (Gemini 3.8 Flash):**
  - Implement Gemini Files API upload process.
  - Build polling loop to wait for file processing completion (`ACTIVE` state).
  - Construct detailed prompts injecting the specific cliff timestamps identified by Agent 2.
  - Parse Gemini's multimodal response (visual + audio context at the exact moments of drop-off).
- **Agent 4: Report Generator (Groq GPT-OSS 20B):**
  - Aggregate outputs from Agent 1 (metadata), Agent 2 (math data), and Agent 3 (multimodal context).
  - Construct structured prompt for GPT-OSS 20B to generate a comprehensive markdown report.
  - Enforce JSON or highly structured markdown output.
- **Orchestrator System:**
  - Implement `PipelineOrchestrator` class.
  - Phase A: Run Agent 1 and Gemini Upload (Agent 3 part 1) concurrently using `asyncio.gather`.
  - Phase B: Run Agent 2, then execute Gemini generation (Agent 3 part 2).
  - Phase C: Run Agent 4.
  - Implement comprehensive error handling and logging at each step.
- **LLM Router:**
  - Implement logic to handle Groq API rate limits (fallback to `groq/compound-mini` if `gpt-oss-20b` fails).

### Dependencies
- Phase 1 (Project Foundation)
- Phase 2 (Authentication & Database - for schema reference)

### Deliverables
- Fully functional Python pipeline capable of taking a video ID and YouTube token, and producing a complete `ForensicReport`.

### Testing Criteria
- Unit tests for Agent 2 math logic verify accurate cliff detection on mock data arrays.
- Integration tests verify successful Gemini API uploads and prompt executions.
- `asyncio.gather` reduces total execution time compared to sequential processing.

---

## Phase 6: API Endpoints

This phase connects the frontend to the backend pipeline and database through secure REST API endpoints.

### Detailed Task List
- **FastAPI Endpoints:**
  - `POST /api/auth/youtube`: Initiates OAuth flow, returns authorization URL.
  - `GET /api/auth/youtube/callback`: Handles Google callback, stores tokens in Supabase `youtube_channels` table.
  - `GET /api/videos`: Fetches recent videos from YouTube API for the authenticated user.
  - `POST /api/analyze`: Receives video ID, triggers background `PipelineOrchestrator` task, creates `analyses` record in Supabase.
  - `GET /api/analyze/{id}/status`: Polls Supabase for the current status of an analysis job.
  - `GET /api/reports`: Lists completed analysis reports for the user.
  - `GET /api/reports/{id}`: Retrieves full details of a specific report.
  - `POST /api/chat`: Receives chat messages, processes them through Agent 5, returns AI response.
- **Security & Middleware:**
  - Implement FastAPI dependency to verify Supabase JWT token from `Authorization` header.
  - Inject authenticated user context into route handlers.
- **CORS Configuration:**
  - Configure FastAPI CORS middleware to allow requests from the Next.js frontend origin.

### Dependencies
- Phase 2 (Authentication & Database)
- Phase 5 (Backend Agents — Core Pipeline)

### Deliverables
- Complete set of secured REST API endpoints.
- OpenAPI documentation available at `/docs`.

### Testing Criteria
- Endpoints return 401 Unauthorized without a valid Supabase JWT.
- `POST /api/analyze` successfully spawns a background task and returns a 202 Accepted status with an analysis ID.
- Status endpoint accurately reflects the pipeline progress.

---

## Phase 7: Dashboard & Feature Pages

This phase builds the core user interface for managing videos and viewing the generated forensic reports.

### Detailed Task List
- **Dashboard Page (`/dashboard`):**
  - Build connection status card (YouTube channel connected vs. disconnected).
  - Create Video Grid displaying thumbnails, titles, and basic stats.
  - Build Analysis History table showing past reports with status badges.
- **Analysis Trigger Flow (`/dashboard/analyze`):**
  - Video selector dropdown (populated by `/api/videos`).
  - Alternative drag-and-drop file upload zone for local testing.
  - "Run Forensic Analysis" button with loading state.
  - Real-time progress UI (stepper component matching pipeline phases) polling `/api/analyze/{id}/status`.
- **Report View Page (`/dashboard/report/[id]`):**
  - **Executive Summary:** High-level overview of video performance.
  - **Health Score Gauge:** Visual indicator of retention quality.
  - **Interactive Chart:** Recharts implementation displaying the retention curve. Overlay markers for detected cliffs.
  - **Cliff Analysis Cards:** Expandable cards for each cliff timestamp containing Gemini's multimodal explanation.
  - **Action Items:** Checklist of prescriptive recommendations.
  - **Positive Highlights:** Showcase segments where retention was unusually high.

### Dependencies
- Phase 3 (Design System & Layout)
- Phase 6 (API Endpoints)

### Deliverables
- Fully functional dashboard interface.
- Interactive, data-rich report visualization page.

### Testing Criteria
- Video grid correctly displays data fetched from the API.
- Recharts visualization accurately plots retention data and cliff markers align with timestamps.
- Progress UI updates dynamically as the backend processes the video.

---

## Phase 8: Chat Agent & Popup

This phase implements the interactive Q&A capability, allowing users to converse with the Groq 120B model about their specific report.

### Detailed Task List
- **Backend (Agent 5 - Chat Agent):**
  - Build integration with Groq API using the `gpt-oss-120b` model.
  - Implement context injection: Pre-pend the entire `ForensicReport` data as system context.
  - Manage conversation history within the request payload.
  - Save messages to Supabase `chat_messages` table.
- **Frontend Chat UI:**
  - Build Floating Action Button (FAB) anchored to the bottom right of the Report View page.
  - Create expandable Chat Panel using Framer Motion for smooth opening/closing.
  - Build message list component with distinct styling for User vs. AI bubbles.
  - Implement input field with "Send" button and "Enter" key submission.
  - Add loading state (typing indicator animation) while waiting for the AI response.
  - Implement auto-scroll to bottom on new messages.

### Dependencies
- Phase 5 (Backend Agents — Core Pipeline - Groq setup)
- Phase 6 (API Endpoints - `/api/chat`)
- Phase 7 (Dashboard & Feature Pages)

### Deliverables
- Interactive AI chat widget contextualized to the current report.

### Testing Criteria
- Chat agent accurately answers questions based *only* on the provided report data.
- UI handles long responses gracefully without breaking layout.
- Conversation history persists if the user navigates away and back (via database fetch).

---

## Phase 9: 3D Polish & Animations

This phase focuses entirely on elevating the User Experience to an award-winning standard.

### Detailed Task List
- **Landing Page 3D Polish:**
  - Adjust lighting, material properties, and post-processing in the R3F canvas to achieve a premium "glass" and "neon" look.
  - Ensure smooth rotation/interaction mechanics based on mouse position.
- **Scroll Animations Fine-tuning:**
  - Optimize GSAP scroll triggers to prevent jank.
  - Add parallax effects to background elements.
- **Dashboard Micro-interactions:**
  - Implement glowing hover states on cards.
  - Add subtle Framer Motion scale effects to buttons.
  - Polish loading skeletons to use sweeping gradient animations (shimmer).
- **Performance Optimization:**
  - Implement dynamic imports (`next/dynamic`) for heavy components (3D canvas, Recharts).
  - Optimize images and Next.js font loading.
  - Run Lighthouse audits and resolve major performance bottlenecks.

### Dependencies
- Phase 4 (Landing Page & Public Pages)
- Phase 7 (Dashboard & Feature Pages)

### Deliverables
- A highly polished, performant, and visually striking application.

### Testing Criteria
- Consistently hit 60fps on animations and scrolling.
- Lighthouse performance score > 90.
- No visual glitches during rapid page transitions.

---

## Phase 10: Testing & Integration

This phase ensures the reliability and accuracy of the entire system before submission.

### Detailed Task List
- **End-to-End Flow Testing:**
  - Execute the complete user journey: Sign Up -> Connect YouTube -> Select Video -> Wait for Analysis -> View Report -> Chat with AI.
- **Agent Validation:**
  - Validate the quality of Gemini 3.8 Flash explanations against known video drops.
  - Tune prompts for both Gemini and Groq if outputs are hallucinated or poorly formatted.
- **Error Handling Scenarios:**
  - Test behavior when YouTube API quotas are exceeded.
  - Test behavior when Gemini video processing fails or times out.
  - Test Groq fallback mechanisms.
  - Verify UI shows graceful error messages, not raw stack traces.
- **Cross-Browser & Mobile Testing:**
  - Verify layout and functionality on Chrome, Safari, and Firefox.
  - Test on simulated mobile devices (iOS Safari, Android Chrome).

### Dependencies
- All previous phases (1-9).

### Deliverables
- Hardened application ready for production deployment.
- Refined AI prompts.

### Testing Criteria
- 10 consecutive E2E tests pass without manual intervention.
- System gracefully handles simulated API failures.

---

## Phase 11: Documentation & Ship

The final phase involves preparing all required assets for the AI Content Engine Hackathon submission.

### Detailed Task List
- **Repository Cleanup:**
  - Remove all debug `print()` and `console.log()` statements.
  - Ensure code is fully linted and formatted.
  - Verify Docker build succeeds locally.
- **README.md Creation:**
  - Write comprehensive documentation including:
    - Project tagline and overview.
    - High-level architecture diagram (mermaid or image).
    - Detailed setup instructions (env vars, Docker commands).
    - Technology stack breakdown.
    - Usage guide and API documentation.
    - Demo video link.
- **Devpost Submission Prep:**
  - Write compelling narrative answering: Inspiration, What it does, How we built it, Challenges, Accomplishments, What we learned, What's next.
  - Format the Devpost page to look professional.
- **Demo Video:**
  - Write script focusing on the problem (creator burnout) and the solution (automated multimodal forensics).
  - Record a crisp 2-minute demo showing the UI and the generated insights.
- **Final Deployment:**
  - Push backend to Railway/Render.
  - Push frontend to Vercel.
  - Configure production environment variables.
  - Final Docker build test.
  - Submit the final Devpost entry before the deadline.

### Dependencies
- Phase 10 (Testing & Integration)

### Deliverables
- Live production URLs.
- Complete Devpost submission.
- Recorded 2-minute demo video.
- Public GitHub repository with excellent documentation.

### Testing Criteria
- Vercel and Railway deployments build successfully.
- Production URLs are accessible and functional.
- Demo video is uploaded and linked correctly.
