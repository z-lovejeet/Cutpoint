# Cutpoint System Architecture

This document outlines the comprehensive system architecture for Cutpoint, an AI-powered YouTube retention analysis tool built for the AI Content Engine Hackathon.

## 1. Architecture Overview

Cutpoint operates as a highly concurrent, multi-agent full-stack web application. The core objective is to analyze YouTube audience retention drops (cliffs) using mathematical analysis and multimodal AI.

The architecture is divided into three primary tiers:
- **Frontend (Client/Presentation):** Next.js 15 (App Router) deployed on Vercel. Handles user authentication, 3D visualizations (React Three Fiber), dashboard rendering, and user interactions.
- **Backend (API/Orchestration):** Python FastAPI deployed on Railway/Render. Acts as the control plane for the multi-agent system, managing async communication with external APIs and orchestrating the forensic pipeline.
- **Data & Auth (Persistence):** Supabase (PostgreSQL + GoTrue Auth). Manages user identities, stores analysis metadata, caching, and enforces Row-Level Security (RLS).

The system uses an event-driven, parallel execution model leveraging Python's `asyncio` to coordinate 8 specialized, autonomous agents. Unlike static pipelines, these agents utilize dynamic tool calling, perception-action-reflection loops, and adversarial debate via a Supervisor Agent to conduct robust forensic investigations.

## 2. System Diagram

```text
                               +-------------------+
                               |                   |
                               |   Web Browser     |
                               | (React, R3F, UI)  |
                               |                   |
                               +--------+----------+
                                        |
                             HTTP / WebSocket (WSS)
                                        |
+---------------------------------------+---------------------------------------+
|                              Vercel (Edge Network)                            |
|                                                                               |
|  +-------------------+      +-------------------+      +-------------------+  |
|  |                   |      |                   |      |                   |  |
|  |  Next.js App      +------+  Next.js Server   +------+  Next.js API      |  |
|  |  (Client Comps)   |      |  (React Server)   |      |  (BFF Layer)      |  |
|  |                   |      |                   |      |                   |  |
|  +-------------------+      +---------+---------+      +---------+---------+  |
+---------------------------------------|--------------------------|------------+
                                        |                          |
                                 Auth Tokens (JWT)           REST / JSON
                                        |                          |
                                        v                          v
+-----------------------+     +-------------------+      +-------------------+
|                       |     |                   |      |                   |
| Supabase Auth         |<----+ Supabase PostgREST|      | FastAPI Backend   |
| (GoTrue / OAuth)      |     | (Data Layer)      |<---->| (Railway/Render)  |
|                       |     |                   |      |                   |
+-----------+-----------+     +---------+---------+      +---------+---------+
            |                           |                          |
            v                           v                          v
+---------------------------------------+-------+      +-------------------+
|                                               |      | Multi-Agent Core  |
|           Supabase PostgreSQL DB              |      | (8 Agents, Tool   |
|           (RLS Policies Enforced)             |      | Calling, asyncio) |
|                                               |      +---------+---------+
+-----------------------------------------------+                |
                                                                 v
                                                       +-------------------+
                                                       | Supervisor Agent  |
                                                       +---------+---------+
                                                                 |
                                 +-------------------------------+-------------------------------+
                                 |                               |                               |
                                 v                               v                               v
                     +-----------------------+       +-----------------------+       +-----------------------+
                     |                       |       |                       |       |                       |
                     |  YouTube API (v3)     |       |  Gemini 3.8 Flash     |       |  Groq API             |
                     |  & Analytics API      |       |  (Forensic & Audio)   |       |  (GPT-OSS 20B/120B)   |
                     |                       |       |                       |       |                       |
                     +-----------------------+       +-----------------------+       +-----------------------+
```

## 3. Frontend Architecture

The frontend is built with Next.js 15 leveraging the App Router. It emphasizes a premium, 3D-heavy UI while maintaining high performance.

### 3.1 Technology Stack
- **Framework:** Next.js 15 (App Router, Server Actions, React 19 rc)
- **Styling:** Tailwind CSS + Shadcn/ui (customized for dark/glassmorphic theme)
- **3D Engine:** React Three Fiber (R3F) + `@react-three/drei`
- **Animations:** GSAP (ScrollTrigger) + Framer Motion
- **Data Visualization:** Recharts (customized for retention graphs)
- **State Management:** Zustand (client state) + SWR/React Query (server state)

### 3.2 App Router Structure
- `/app/(marketing)`: Landing, About. Uses edge caching, highly static.
- `/app/(auth)`: Sign-in, Register. Minimal layout, focus on conversion.
- `/app/(dashboard)`: Dashboard, Analysis, Report. Protected routes, heavily dynamic.

### 3.3 Client vs Server Components
- **Server Components (Default):** Used for layouts, data fetching, SEO metadata, and passing initial state. Ensures minimal JavaScript payload.
- **Client Components (`'use client'`):** Used for interactive elements (buttons, forms), GSAP animations, Recharts, and all 3D canvas rendering.

### 3.4 Handling 3D Assets (R3F)
React Three Fiber relies heavily on the browser window and WebGL. To prevent server-side rendering (SSR) errors in Next.js, all 3D components are dynamically imported with SSR disabled.

```typescript
// components/HeroScene.tsx
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/components/canvas/Scene'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-surface-dark h-full w-full rounded-lg" />
})

export default function HeroScene() {
  return <Scene />
}
```

## 4. Backend Architecture

The backend is written in Python using FastAPI, designed to orchestrate the complex, multi-step asynchronous AI workflows required by the Cutpoint process.

### 4.1 Technology Stack
- **Framework:** FastAPI (Uvicorn/Gunicorn runner)
- **Concurrency:** `asyncio` for non-blocking I/O and parallel agent execution
- **Math/Data:** NumPy, SciPy (for signal processing and cliff detection)
- **Clients:** `google-api-python-client` (YouTube), `google-generativeai` (Gemini), `groq` (Groq API), `supabase` (DB/Auth)

### 4.2 Application Layers
1. **API Router Layer (`/routers`):** Handles incoming HTTP requests, dependency injection (authentication verification), and response formatting.
2. **Service Layer (`/services`):** Contains business logic for interacting with Supabase, YouTube, Gemini, and Groq.
3. **Agent Orchestrator (`/agents`):** The core engine. Defines the 8 specific agents and manages the dynamic orchestration and debate loops through the Supervisor Agent.

### 4.3 The Agent Orchestrator
The orchestrator manages the state of an analysis job using a shared `AnalysisState`. It uses the Supervisor Agent to dynamically direct the workflow based on intermediate findings.

```python
# pseudo-code for orchestrator
async def run_analysis_pipeline(video_id: str, user_id: str):
    state = AnalysisState(video_id=video_id)
    
    # Phase 1 & 2: Ingestion and Math Processing
    youtube_data, video_uri = await asyncio.gather(
        data_ingestion_agent.fetch(video_id),
        upload_video(video_id)
    )
    state.cliffs = await cliff_detector_agent.detect(youtube_data)
    
    # Phase 3 & 4: Fan-out Investigation and Debate Loop
    # Supervisor plans and dispatches Forensic and Audio agents
    investigation_plan = await supervisor_agent.plan_investigation(state.cliffs)
    
    while not all_cliffs_verified(state.cliffs):
        # Parallel multimodal and audio analysis
        await asyncio.gather(
            forensic_agent.investigate(state, investigation_plan),
            audio_cadence_agent.analyze(state, investigation_plan)
        )
        
        # Critic debate loop
        await retention_critic_agent.evaluate(state)
        await supervisor_agent.resolve_conflicts(state)
    
    # Phase 5: Synthesis
    final_report = await report_synthesizer_agent.generate(state)
    return final_report
```

## 5. Multi-Agent Pipeline

The pipeline is designed to minimize overall latency by parallelizing steps that do not have direct dependencies, while allowing for complex autonomous loops during investigation.

### 5.1 Pipeline Flow Diagram

```text
Time (s) | Activity
---------|-------------------------------------------------------------------------
  0.0    | [User Submits Video Analysis Request]
         | 
  0.1    | +--------------------------------+  +----------------------------------+
         | | Data Ingestion Agent           |  | Video Prep Process               |
         | | - Calls YouTube Data API       |  | - Downloads/Streams video        |
         | | - Calls YT Analytics API       |  | - Extracts audio track           |
         | +--------------------------------+  +----------------------------------+
  2.5    |               |                                      |
         |               v                                      v
  2.6    | +--------------------------------+  +----------------------------------+
         | | Cliff Detector Agent           |  | Wait State                       |
         | | - Multi-algo ensemble          |  | - Prepares multimodal context    |
         | | - Identifies steepest drops    |  |                                  |
         | +--------------------------------+  +----------------------------------+
  3.0    |               |                                      |
         |               +------------------+-------------------+
         |                                  |
  3.1    |                                  v
         | +----------------------------------------------------------------------+
         | | Supervisor Agent (Groq GPT-OSS 120B)                                 |
         | | - Dispatches Forensic & Audio agents based on identified cliffs.     |
         | +----------------------------------------------------------------------+
         |                                  |
  3.5    | +--------------------------------+-------------------------------------+
         | | Multimodal Forensic Agent      |  Audio & Cadence Agent              |
         | | (Gemini 3.8 Flash)             |  (Gemini 3.8 Flash)                 |
         | | - inspect_keyframes            |  - analyze_speech_cadence           |
         | | - measure_visual_stagnancy     |  - detect_dead_air                  |
         | +--------------------------------+-------------------------------------+
         |                                  |
  7.0    | +----------------------------------------------------------------------+
         | | Retention Critic Agent (Groq GPT-OSS 120B)                           |
         | | - Evaluates findings. If confidence < 0.8, triggers Re-Investigation |
         | +----------------------------------------------------------------------+
         |                                  | (Debate Loop: potentially returns to 3.5)
 10.1    | +----------------------------------------------------------------------+
         | | Report Synthesizer Agent (Groq GPT-OSS 20B)                          |
         | | - Ingests verified findings + statistical context.                   |
         | | - Formats structured forensic report (JSON) + markdown summary.      |
         | +----------------------------------------------------------------------+
 12.0    | [Report Saved to DB -> Returned to User]
         |
  ...    | [User views report and initiates chat]
         |
  N      | +----------------------------------------------------------------------+
         | | Strategist Chat Agent (Groq GPT-OSS 120B)                            |
         | | - Maintains conversation context and executes follow-up tools.       |
         | +----------------------------------------------------------------------+
```

### 5.2 Agent Profiles
1. **Supervisor Agent (Groq GPT-OSS 120B):** Lead Investigator. Plans investigation strategy, dispatches specialists, resolves conflicts, determines confidence.
2. **Data Ingestion Agent (Non-LLM):** The Archivist. Pure API with self-healing behaviors, handling autonomous retry and anomaly flagging.
3. **Cliff Detector Agent (Non-LLM):** The Mathematician. Uses NumPy/SciPy for multi-algorithm ensemble anomaly detection with self-tuning sensitivity.
4. **Multimodal Forensic Agent (Gemini 3.8 Flash):** The Visual Detective. Investigates visuals dynamically using tools like `inspect_keyframes` and `measure_visual_stagnancy`.
5. **Audio & Cadence Agent (Gemini 3.8 Flash):** The Sound Engineer. Analyzes speech patterns, dead air, audio energy, and transcript sentiment using tools like `detect_dead_air` and `analyze_speech_cadence`.
6. **Retention Critic Agent (Groq GPT-OSS 120B):** The Skeptic. Challenges hypotheses, scores evidence strength, and forces re-investigation loops.
7. **Report Synthesizer Agent (Groq GPT-OSS 20B):** The Executive Editor. Compiles verified findings into a polished Forensic Retention Report with iterative refinement.
8. **Strategist Chat Agent (Groq GPT-OSS 120B):** The Studio Advisor. Handles interactive Q&A with function calling tools to re-query specific data or report sections.

## 6. Database Architecture

Database: Supabase PostgreSQL
Schema: `public`

### 6.1 Tables

#### Table: `users`
Managed primarily by Supabase Auth (references `auth.users`), extended here for app-specific data.
- `id` (uuid, PK, refs `auth.users.id`)
- `email` (text)
- `full_name` (text)
- `avatar_url` (text)
- `created_at` (timestamptz)

#### Table: `youtube_channels`
Stores connected channel metadata.
- `id` (uuid, PK)
- `user_id` (uuid, FK to `users.id`)
- `yt_channel_id` (text, unique)
- `title` (text)
- `thumbnail_url` (text)
- `access_token` (text, encrypted)
- `refresh_token` (text, encrypted)
- `token_expires_at` (timestamptz)

#### Table: `analyses`
Tracks analysis jobs.
- `id` (uuid, PK)
- `user_id` (uuid, FK to `users.id`)
- `video_id` (text)
- `video_title` (text)
- `status` (enum: 'pending', 'fetching', 'analyzing', 'completed', 'failed')
- `created_at` (timestamptz)
- `completed_at` (timestamptz, nullable)

#### Table: `reports`
Stores the final forensic output.
- `id` (uuid, PK)
- `analysis_id` (uuid, FK to `analyses.id`)
- `raw_retention_data` (jsonb)
- `cliffs` (jsonb) - array of timestamps and drop percentages
- `ai_analysis` (jsonb) - the structured Gemini/Groq output
- `prescriptive_recommendations` (text)

#### Table: `chat_messages`
Stores Q&A history.
- `id` (uuid, PK)
- `report_id` (uuid, FK to `reports.id`)
- `role` (enum: 'user', 'assistant')
- `content` (text)
- `created_at` (timestamptz)

### 6.2 Row-Level Security (RLS) Policies
RLS is strictly enforced. Examples:
- `analyses`: `CREATE POLICY "Users can only view their own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);`
- `reports`: `CREATE POLICY "Users can view reports for their analyses" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM analyses WHERE analyses.id = reports.analysis_id AND analyses.user_id = auth.uid()));`

## 7. Authentication Flow

Authentication uses Supabase SSR (Server-Side Rendering) architecture to maintain secure cookie-based sessions across Next.js Server Components.

### 7.1 OAuth Flow (Google / YouTube)

```text
User clicks "Connect YouTube"
       |
       v
Next.js Server Action calls Supabase client `signInWithOAuth`
(Scopes: openid, email, profile, https://www.googleapis.com/auth/yt-analytics.readonly)
       |
       v
Redirects to Google Consent Screen
       |
       v
Google redirects to `/auth/callback?code=xxx`
       |
       v
Next.js Route Handler (`/api/auth/callback`)
- Exchanges code for Supabase Session
- Extracts Provider Tokens (YouTube Access/Refresh tokens)
- Saves Provider Tokens to `youtube_channels` table
- Sets `sb-access-token` / `sb-refresh-token` cookies
       |
       v
Redirects user to `/dashboard`
```

### 7.2 Session Management
Next.js Middleware (`middleware.ts`) intercepts every request to `/dashboard/*`. It uses `@supabase/ssr` `createServerClient` to check the session. If the token is expired, Supabase automatically attempts to refresh it and updates the cookies in the response headers.

## 8. API Layer Design (Backend FastAPI)

The Next.js frontend communicates with the FastAPI backend primarily via REST.

### `POST /api/v1/analyze`
Starts a new analysis job.
- **Request:** `{ "video_id": "dQw4w9WgXcQ" }`
- **Headers:** `Authorization: Bearer <Supabase-JWT>`
- **Response:** `{ "analysis_id": "uuid", "status": "pending" }` (Returns immediately, job runs in background)

### `GET /api/v1/analyses/{analysis_id}/status`
Polls for job status.
- **Response:** `{ "status": "analyzing", "progress": 65, "current_step": "Supervisor routing investigation to Forensic and Audio agents" }`

### `GET /api/v1/reports/{report_id}`
Fetches completed report.
- **Response:** 
  ```json
  {
    "id": "uuid",
    "video_id": "...",
    "cliffs": [
      { "timestamp_sec": 124, "drop_percentage": 15.2, "cause_summary": "Sudden audio volume change and off-topic tangent." }
    ],
    "recommendations": ["Normalize audio levels in post-production.", "Keep intro hooks under 15 seconds."]
  }
  ```

### `POST /api/v1/chat`
Sends a message to the Chat Agent.
- **Request:** `{ "report_id": "uuid", "message": "Can you explain why the drop at 2:04 was so severe?" }`
- **Response:** (Server-Sent Events / SSE for streaming text response)

## 9. External API Integration Map

| Service | API Endpoint / SDK | Auth Method | Rate Limit Context | Usage in App |
|---------|-------------------|-------------|--------------------|--------------|
| **YouTube** | `youtubeAnalytics/v2/reports` | OAuth2 Access Token (per user) | 200 req/day (YT Default) | Fetching `audienceWatchRatio` data. |
| **YouTube** | `youtube/v3/videos` | API Key / OAuth2 | 10k units/day | Fetching video metadata (title, length). |
| **Gemini** | `generativeai.upload_file` | API Key (`GEMINI_API_KEY`) | Vertex AI quotas | Uploading video for context. |
| **Gemini** | `models/gemini-3.8-flash` | API Key (`GEMINI_API_KEY`) | Vertex AI quotas | Multimodal video analysis at cliffs. |
| **Groq** | `groq.chat.completions.create` | API Key (`GROQ_API_KEY`) | High throughput | Fast report generation (`gpt-oss-20b`) & chat (`gpt-oss-120b`). |
| **Supabase**| `@supabase/supabase-js` | Service Role Key (Backend) | Cloud quotas | DB Read/Write, Auth verification. |

## 10. Error Handling Strategy

Resilience is critical due to reliance on multiple third-party APIs.

- **API Retries:** Using `tenacity` in Python. Network calls to YouTube and Groq have automatic exponential backoff (max 3 retries) for 429 (Rate Limit) and 5xx errors.
- **Agent Failure Recovery:** Agents feature self-correction loops. For instance, if the Data Ingestion Agent encounters an error, it autonomously retries or alters its strategy. If a tool fails for the Forensic or Audio agents, the Supervisor logs the error, attempts a fallback tool, or alerts the Critic Agent to proceed with lowered confidence. If the overall investigation fails, the Supervisor marks the job as `failed` and logs the trace to the DB.
- **Fallback Models:** If `gpt-oss-120b` is overloaded during chat, the backend falls back to `groq-compound-mini`.
- **Global Error Boundaries:** React Error Boundaries wrap Next.js layouts to catch client-side rendering crashes (especially useful for 3D R3F context losses).

## 11. Deployment Architecture

- **Frontend (Vercel):** Connected to GitHub. Automatically builds and deploys Next.js on `main` branch pushes. Edge caching enabled for static assets and marketing pages.
- **Backend (Railway/Render):** Deployed via Docker container. 
  - `Dockerfile` sets up Python 3.12, installs dependencies via `requirements.txt` or `poetry`.
  - Exposes port 8000.
  - Runs via `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`.
- **Database (Supabase):** Hosted Supabase project. Migrations managed via Supabase CLI (`supabase db push`).

**Key Environment Variables (Backend):**
- `DATABASE_URL` (Supabase connection pooler URL)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET`

## 12. Security

- **Minimal OAuth Scopes:** The app requests *only* `yt-analytics.readonly` and profile info. It does not request write access to YouTube.
- **API Key Protection:** All external API keys (Gemini, Groq) reside purely on the Python backend. The Next.js frontend NEVER exposes these to the browser.
- **JWT Verification:** The FastAPI backend verifies the Supabase JWT sent in the `Authorization` header of every request using the Supabase JWT secret to ensure the user is authenticated and hasn't spoofed their ID.
- **CORS:** FastAPI is configured to only accept requests from the Vercel production domain and `localhost:3000` during development.

## 13. Project Structure

### Monorepo Layout (Conceptual)

```text
retention-forensics/
│
├── frontend/                     # Next.js Application
│   ├── app/                      # App Router
│   │   ├── (auth)/               # login, register
│   │   ├── (dashboard)/          # dashboard, analysis
│   │   ├── (marketing)/          # home, about
│   │   ├── api/                  # route handlers (auth callbacks)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── canvas/               # R3F 3D components
│   │   ├── ui/                   # Shadcn components
│   │   └── shared/               # Reusable non-UI logic
│   ├── lib/
│   │   ├── supabase/             # SSR clients
│   │   └── utils.ts
│   ├── public/                   # 3D models (.gltf), textures
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                      # FastAPI Application
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── api/                  # Route definitions
│   │   │   └── v1/
│   │   ├── core/                 # Config, security, DB setup
│   │   ├── agents/               # Multi-agent orchestrator logic
│   │   ├── services/             # API clients (YouTube, Groq, Gemini)
│   │   └── models/               # Pydantic schemas
│   ├── requirements.txt
│   └── Dockerfile
│
└── supabase/                     # Supabase local config
    ├── migrations/               # SQL schema definitions
    └── config.toml
```
