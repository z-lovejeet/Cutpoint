# 🎬 Cutpoint

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_3.8_Flash-Multimodal-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Fast_Inference-F05A28?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)

**Pinpoint the cuts that cost you viewers.**

*A forensic AI intelligence platform that explains WHY YouTube viewers leave at specific timestamps and prescribes editing changes to maximize audience retention.*

[Features](#-key-features) • [Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [Quickstart](#-quickstart) • [Roadmap](#-development-roadmap)

</div>

---

## 📌 Overview

Every YouTube creator has stared at a steep cliff in their YouTube Studio retention graph—watching 30% to 50% of their audience vanish at a specific second. YouTube tells you **where** viewers leave, but never **why**.

**Cutpoint** bridges this gap by cross-referencing quantitative YouTube Analytics data with **Google Gemini 3.8 Flash multimodal video intelligence**:
1. **Mathematical Cliff Detection**: Calculates the first derivative of the `audienceWatchRatio` curve to detect critical drop-offs.
2. **Multimodal Forensic Analysis**: Uploads the raw video to Gemini Files API and inspects visual cuts, audio transitions, speaker engagement, and pacing strictly within the drop-off window.
3. **Prescriptive Action Plan**: Generates actionable, timestamp-specific editing recommendations and provides an interactive AI Chat Agent for follow-up strategy questions.

---

## ⚡ Key Features

- 🔬 **Automated Retention Cliff Detection**: Pure NumPy calculus isolates the sharpest viewership drop-offs in seconds.
- 👁️ **Multimodal Video Understanding**: Gemini 3.8 Flash watches the exact cliff timestamps (audio, pacing, visual variety, B-roll).
- 📑 **Actionable Forensic Reports**: Structured diagnosis explaining the root cause of audience loss + prioritized fixes.
- 💬 **Interactive Chat Agent**: An in-context AI companion (powered by Groq) that answers questions directly about your video's report.
- 🌐 **Spatial 3D Experience**: Award-winning dark mode interface built with Next.js 15, React Three Fiber, and GSAP.
- 🔒 **Enterprise-Grade Security**: Supabase Auth with Google OAuth 2.0, Row-Level Security (RLS), and zero client-exposed API keys.

---

## 🤖 Multi-Agent Pipeline

Cutpoint uses a high-concurrency, asynchronous agent architecture running via Python `asyncio`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUTPOINT ORCHESTRATOR                        │
│                                                                 │
│   Phase 1 (Parallel)          Phase 2 (Parallel)                │
│   ┌───────────┐ ┌──────────┐  ┌───────────┐ ┌────────────────┐  │
│   │ AGENT 1   │ │ AGENT 3  │  │ AGENT 2   │ │ AGENT 3 (cont) │  │
│   │ Data      │ │ Video    │  │ Cliff     │ │ Video          │  │
│   │ Fetcher   │ │ Uploader │  │ Detector  │ │ Analyzer       │  │
│   │ (YT APIs) │ │ (Gemini) │  │ (NumPy)   │ │ (Gemini Flash) │  │
│   └───────────┘ └──────────┘  └───────────┘ └────────────────┘  │
│                                                                 │
│   Phase 3                     Phase 4 (User-Triggered)          │
│   ┌──────────────────┐        ┌──────────────────────────────┐  │
│   │ AGENT 4          │        │ AGENT 5                      │  │
│   │ Report Generator │        │ Chat Agent                   │  │
│   │ (Groq GPT-OSS)   │        │ (Groq In-Context Q&A)        │  │
│   └──────────────────┘        └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + TypeScript + React 18/19
- **3D & Spatial**: React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), Three.js
- **Motion & Styling**: Tailwind CSS, GSAP ScrollTrigger, Framer Motion, Lucide Icons
- **Auth & State**: `@supabase/ssr`, `@supabase/supabase-js`, Zustand, Zod

### Backend
- **Framework**: FastAPI (Python 3.13) with `uv` package manager
- **Math & Analytics**: NumPy, SciPy (differential calculus on retention arrays)
- **AI Models**:
  - **Video Analysis**: Google Gemini 3.8 Flash (Vertex AI / Google AI Studio)
  - **Report & Synthesis**: Groq `openai/gpt-oss-20b`
  - **Interactive Chat**: Groq `openai/gpt-oss-120b`
- **APIs**: YouTube Analytics API (`reports.query`), YouTube Data API v3 (`videos.list`)

### Infrastructure
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **Containerization**: Docker & Docker Compose
- **Automation**: Root `Makefile` for unified developer workflows

---

## 🚀 Quickstart

### Prerequisites
- Node.js `v20+` (tested on `v24`)
- Python `3.11+` (tested on `3.13`) with [`uv`](https://docs.astral.sh/uv/)
- Docker & Docker Compose (optional)

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/cutpoint.git
cd cutpoint

# Copy environment variables template
cp .env.example .env
```

### 2. Install Dependencies
```bash
make install
```

### 3. Launch Development Stack
```bash
make dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Repository Structure

```text
cutpoint/
├── frontend/                     # Next.js 15 App Router Frontend
│   ├── app/                      # Pages, layouts, and globals
│   ├── components/               # UI and 3D Canvas components
│   ├── lib/                      # Supabase SSR clients and utilities
│   ├── tailwind.config.ts        # Custom Deep Space design tokens
│   └── package.json
│
├── backend/                      # FastAPI Python Backend
│   ├── src/
│   │   ├── main.py               # Application entrypoint & CORS
│   │   ├── core/                 # Pydantic Settings & security config
│   │   ├── api/                  # API v1 routes
│   │   ├── agents/               # Multi-agent orchestrator implementations
│   │   ├── services/             # YouTube, Gemini, and Groq clients
│   │   └── models/               # Pydantic data schemas
│   ├── tests/                    # Pytest test suite
│   ├── pyproject.toml            # Dependencies and linter configurations
│   └── Dockerfile
│
├── docs/                         # Comprehensive Engineering Specifications
│   ├── PRD.md                    # Product Requirements Document
│   ├── ARCHITECTURE.md           # System Architecture & diagrams
│   ├── AGENTS.md                 # Multi-Agent specifications & prompts
│   ├── API_GUIDE.md              # Endpoints, quotas, and auth guides
│   ├── SCHEMA.md                 # Pydantic & Supabase database schemas
│   ├── UI_SPEC.md                # 7-page wireframes & 3D component specs
│   ├── PROMPTS.md                # Optimized prompt templates
│   ├── ENV_SETUP.md              # Complete deployment & setup instructions
│   ├── DEV_ROADMAP.md            # Phased development plan
│   └── DESIGN_SYSTEM.md          # Tokens, typography, and glassmorphism rules
│
├── .env.example                  # Master environment variable template
├── Makefile                      # Unified developer orchestration
└── docker-compose.yml            # Multi-container orchestration
```

---

## 🗺️ Development Roadmap

- [x] **Phase 1: Project Foundation** — Monorepo setup, Next.js 15 + R3F, FastAPI + Python 3.13, Docker, Makefile, design tokens.
- [ ] **Phase 2: Authentication & Database** — Supabase Auth (Google OAuth + Email), PostgreSQL schemas with RLS, auth middleware.
- [ ] **Phase 3: Design System & Shared Layout** — Navigation, footer, glassmorphism components, page transitions.
- [ ] **Phase 4: Landing Page & Public Pages** — 3D interactive hero, GSAP scroll-driven storytelling, about page.
- [ ] **Phase 5: Backend Multi-Agent Engine** — Agent 1 (Data Fetcher), Agent 2 (Cliff Detector), Agent 3 (Video Analyzer), Agent 4 (Reporter).
- [ ] **Phase 6: API Layer & Endpoints** — YouTube OAuth connect, analysis triggers, polling, and reports.
- [ ] **Phase 7: Dashboard & Analytics Hub** — Channel health indicators, video list, interactive retention graph.
- [ ] **Phase 8: Chat Agent & Popup** — Floating interactive Q&A assistant powered by Groq GPT-OSS.
- [ ] **Phase 9: 3D Visual Polish** — Ambient spatial lighting, micro-interactions, responsive canvas.
- [ ] **Phase 10: Testing & Verification** — End-to-end integration and load testing.
- [ ] **Phase 11: Ship & Demo** — Video recording, documentation, and Devpost submission.

---

## 🏆 Hackathon Context

Built for the **AI Content Engine Hackathon 2026** on Devpost.
- **Theme**: *Build tools that automate the channel*
- **Primary Focus**: Eliminating post-production administrative friction and unlocking algorithmic growth through actionable video diagnostics.

---

## 📄 License

MIT License © 2026 Cutpoint Team
