# Cutpoint — Environment Setup Guide

This document provides a comprehensive, step-by-step guide to setting up the Cutpoint development environment from zero. It is designed to be easily followed by developers and AI agents alike.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Step 1: Clone & Install](#step-1-clone--install)
3. [Step 2: Google Cloud Console Setup](#step-2-google-cloud-console-setup)
4. [Step 3: Google AI Studio / Vertex AI Setup](#step-3-google-ai-studio--vertex-ai-setup)
5. [Step 4: Groq API Setup](#step-4-groq-api-setup)
6. [Step 5: Supabase Setup](#step-5-supabase-setup)
7. [Step 6: Environment Variables](#step-6-environment-variables)
8. [Step 7: Run the Project](#step-7-run-the-project)
9. [Docker Setup](#docker-setup)
10. [Troubleshooting](#troubleshooting)
11. [Makefile](#makefile)

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your machine. The commands below are for macOS (using Homebrew).

*   **Node.js 20+**: The JavaScript runtime for the frontend Next.js application.
    ```bash
    brew install node@20
    ```
*   **Python 3.11+**: The Python runtime for the FastAPI backend.
    ```bash
    brew install python@3.11
    ```
*   **uv**: An extremely fast Python package and project manager, written in Rust.
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```
*   **Docker Desktop**: For running the application in isolated containers.
    ```bash
    brew install --cask docker
    ```
*   **Git**: For version control.
    ```bash
    brew install git
    ```
*   **Make**: Standard build automation tool (usually pre-installed on macOS).

---

## Step 2: Clone & Install

### 2.1 Clone the Repository

Clone the project repository to your local machine:

```bash
git clone https://github.com/your-org/Cutpoint.git
cd Cutpoint
```

### 2.2 Frontend Installation

The frontend is built with Next.js 15, React, React Three Fiber, GSAP, Tailwind CSS, and Shadcn UI.

```bash
cd frontend
npm install
```

**Frontend Dependencies (`package.json` overview):**

```json
{
  "name": "retention-forensics-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.16.0",
    "@react-three/drei": "^9.105.0",
    "three": "^0.164.0",
    "gsap": "^3.12.5",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0",
    "@supabase/ssr": "^0.3.0",
    "@supabase/supabase-js": "^2.43.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.370.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.2",
    "@radix-ui/react-slot": "^1.0.2"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/three": "^0.164.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "15.0.0"
  }
}
```

### 2.3 Backend Installation

The backend is built with Python, FastAPI, NumPy/SciPy for cliff detection, and various API clients. We use `uv` for lightning-fast dependency management.

```bash
cd ../backend
uv venv
source .venv/bin/activate
uv sync
```

**Backend Dependencies (`pyproject.toml` overview):**

```toml
[project]
name = "retention-forensics-backend"
version = "0.1.0"
description = "FastAPI backend for Cutpoint"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.111.0",
    "uvicorn>=0.30.0",
    "google-api-python-client>=2.130.0",
    "google-auth-oauthlib>=1.2.0",
    "google-auth-httplib2>=0.2.0",
    "google-genai>=0.5.0",
    "groq>=0.9.0",
    "numpy>=1.26.0",
    "scipy>=1.13.0",
    "pydantic>=2.7.0",
    "httpx>=0.27.0",
    "python-dotenv>=1.0.0",
    "python-multipart>=0.0.9"
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.2.0",
    "pytest-asyncio>=0.23.0",
    "ruff>=0.4.0",
    "black>=24.4.0"
]
```

---

## Step 3: Google Cloud Console Setup

To interact with YouTube data via the **Data Ingestion Agent**, you must configure a Google Cloud Project and obtain OAuth 2.0 credentials.

1.  **Create Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/). Click the project dropdown in the top bar and select "New Project". Name it `Cutpoint-Dev`.
2.  **Enable APIs**:
    *   Navigate to **APIs & Services > Library**.
    *   Search for **YouTube Data API v3** and click **Enable**.
    *   Search for **YouTube Analytics API** and click **Enable**.
3.  **Configure OAuth Consent Screen**:
    *   Navigate to **APIs & Services > OAuth consent screen**.
    *   Choose **External** user type.
    *   Fill in the required fields (App name: Cutpoint, User support email, Developer contact information).
    *   Click **Save and Continue**.
    *   Under **Scopes**, click **Add or Remove Scopes**. Add the following:
        *   `https://www.googleapis.com/auth/youtube.readonly`
        *   `https://www.googleapis.com/auth/yt-analytics.readonly`
    *   Add your own Google account email under **Test users** (required while the app is in "Testing" status).
4.  **Create Credentials**:
    *   Navigate to **APIs & Services > Credentials**.
    *   Click **Create Credentials > OAuth client ID**.
    *   Application type: **Web application**.
    *   Name: `Cutpoint-Local`.
    *   Authorized JavaScript origins: `http://localhost:3000`
    *   Authorized redirect URIs:
        *   `http://localhost:3000/auth/callback` (Frontend Next.js handling)
        *   `http://localhost:8000/auth/callback` (Backend direct handling if needed)
    *   Click **Create**.
5.  **Download Credentials**:
    *   Copy the **Client ID** and **Client Secret**. You will need these for your `.env` file.
    *   Alternatively, download the JSON file and rename it to `client_secret.json` in your backend directory (for standalone testing).

*(UI flow: Cloud Console Dashboard -> APIs & Services -> Library -> Enable YouTube APIs -> OAuth Consent Screen -> Credentials -> Create Web App Client ID)*

---

## Step 4: Google AI Studio / Vertex AI Setup

Cutpoint uses Gemini 3.8 Flash for multimodal video and audio analysis. This API is used by both the **Multimodal Forensic Agent** and the **Audio & Cadence Agent**. You can use either Google AI Studio (simpler) or Vertex AI (enterprise).

### Option A: Google AI Studio (Recommended for Dev)

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Sign in with your Google account.
3.  Click **Create API key**.
4.  Select your Google Cloud project (`Cutpoint-Dev`).
5.  Copy the generated API key.
6.  Set this value to `GEMINI_API_KEY` in your backend `.env` file.

### Option B: Vertex AI (Production / High Quotas)

1.  In Google Cloud Console, navigate to **Vertex AI > Dashboard** and enable the API.
2.  Navigate to **IAM & Admin > Service Accounts**.
3.  Create a new Service Account (`vertex-ai-caller`).
4.  Grant it the **Vertex AI User** role.
5.  Click on the newly created service account, go to the **Keys** tab, and click **Add Key > Create new key > JSON**.
6.  Download the JSON file.
7.  Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the absolute path of this downloaded file.

---

## Step 5: Groq API Setup

Groq provides extremely low-latency inference for open-source models. It powers several key agents in our 8-agent architecture: the **Supervisor Agent**, **Report Synthesizer Agent**, and **Strategist Chat Agent**. Importantly, it also powers the **Retention Critic Agent** (The Skeptic), which heavily utilizes Groq's GPT-OSS 120B model for deep reasoning, adversarial questioning, and multi-agent debate.

1.  Navigate to the [Groq Console](https://console.groq.com/).
2.  Log in or create a free account.
3.  Go to **API Keys** in the sidebar.
4.  Click **Create API Key**.
5.  Name it `Cutpoint-Dev`.
6.  Copy the key immediately (it is only shown once).
7.  Set this value to `GROQ_API_KEY` in your backend `.env` file.

**Verified Models Available on Groq (Sept 2026):**
*   `openai/gpt-oss-120b` (Flagship reasoning - used for Chat Agent)
*   `openai/gpt-oss-20b` (Fast text generation - used for Report Generator)
*   `groq/compound` (Agentic routing)
*   `groq/compound-mini` (Fast single tool/fallback)

---

## Step 6: Supabase Setup

Supabase handles our database (PostgreSQL), authentication, and potentially blob storage.

1.  **Create Project**: Go to [Supabase](https://supabase.com/dashboard) and create a new project. Name it `Cutpoint`. Save your database password securely.
2.  **Get API Keys**:
    *   Go to **Project Settings > API**.
    *   Copy the **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`).
    *   Copy the **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    *   Copy the **service_role** key (`SUPABASE_SERVICE_ROLE_KEY` - keep this secret!).
3.  **Configure Authentication Providers**:
    *   Go to **Authentication > Providers**.
    *   **Email**: Ensure it is enabled.
    *   **Google**: Enable it. Input the `Client ID` and `Client Secret` you obtained from Google Cloud Console in Step 3.
4.  **Database Schema & RLS**:
    *   Navigate to **SQL Editor**.
    *   Copy the contents of `docs/SCHEMA.md` (which should contain your `CREATE TABLE` statements for users, videos, analyses, and reports).
    *   Run the SQL to create the tables.
    *   Ensure RLS (Row Level Security) policies are enabled in your SQL script (e.g., `ALTER TABLE videos ENABLE ROW LEVEL SECURITY; CREATE POLICY "Users can only view own videos" ON videos FOR SELECT USING (auth.uid() = user_id);`).

---

## Step 7: Environment Variables

Create `.env` files in both the root directory (if using Docker) or specifically in the `frontend` and `backend` directories. Here is the complete template.

Copy `.env.example` to `.env` and fill in the values.

```env
# ==============================================================================
# Cutpoint Environment Variables
# ==============================================================================

# ------------------------------------------------------------------------------
# Supabase Configuration
# ------------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ------------------------------------------------------------------------------
# Google Cloud / YouTube API Configuration
# ------------------------------------------------------------------------------
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"
GOOGLE_CLOUD_PROJECT="cutpoint-dev"

# ------------------------------------------------------------------------------
# AI Models Configuration
# ------------------------------------------------------------------------------
# Used by the Multimodal Forensic Agent and Audio & Cadence Agent
# Set this if using Google AI Studio
GEMINI_API_KEY="your-gemini-api-key"

# Set this if using Vertex AI (requires service account JSON file path)
# GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/vertex-sa-key.json"

# Used by Supervisor, Retention Critic, Report Synthesizer, and Strategist Chat agents
GROQ_API_KEY="gsk_your-groq-api-key"

# ------------------------------------------------------------------------------
# Application Configuration
# ------------------------------------------------------------------------------
# Next.js will use this to call the Python backend
NEXT_PUBLIC_API_URL="http://localhost:8000"

# FastAPI will use this to allow CORS from the Next.js frontend
BACKEND_CORS_ORIGINS="http://localhost:3000"
```

---

## Step 8: Run the Project

### Local Development (Using Make)

The easiest way to run the entire stack locally is using the provided `Makefile`.

```bash
# Run both frontend and backend concurrently
make dev
```

### Manual Execution

If you prefer to run them in separate terminal windows:

**Frontend (Terminal 1):**
```bash
cd frontend
npm run dev
```
*(Runs on http://localhost:3000)*

**Backend (Terminal 2):**
```bash
cd backend
source .venv/bin/activate
uv run uvicorn src.main:app --reload --port 8000
```
*(Runs on http://localhost:8000. API docs at http://localhost:8000/docs)*

---

## Docker Setup

For consistent deployments and isolated execution, the project is fully Dockerized.

### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project specification
COPY pyproject.toml uv.lock* ./

# Install dependencies in system python
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    env_file:
      - .env
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./backend/src:/app/src
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Run the entire stack via Docker:
```bash
make docker-up
# or explicitly: docker-compose up --build
```

---

## Troubleshooting

Here are common issues encountered during setup and how to fix them.

### 1. Google OAuth "redirect_uri_mismatch" Error
**Symptom:** When clicking "Sign in with Google", you get a Google 400 error page stating the redirect URI does not match.
**Fix:** Ensure that `http://localhost:3000/auth/callback` is explicitly added to the **Authorized redirect URIs** section of your Google Cloud Console OAuth 2.0 Client ID settings. Also, ensure your `.env` `GOOGLE_REDIRECT_URI` matches exactly (no trailing slashes).

### 2. CORS Errors from Backend
**Symptom:** Browser console shows `Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:3000' has been blocked by CORS policy`.
**Fix:** Verify `BACKEND_CORS_ORIGINS="http://localhost:3000"` is correctly set in your `.env` file and that the FastAPI `CORSMiddleware` in `src/main.py` is reading this environment variable properly.

### 3. Supabase Authentication / Cookie Issues
**Symptom:** User signs in, but page refreshes to logged-out state.
**Fix:** When using `@supabase/ssr` with Next.js App Router, ensure your middleware (`middleware.ts`) is correctly intercepting requests to refresh the session cookie. Check that `NEXT_PUBLIC_SUPABASE_URL` is set.

### 4. Gemini Files API Upload Timeout
**Symptom:** Backend hangs or times out when trying to upload the video file to Gemini via `google-genai`.
**Fix:** Video files can be large. Ensure your FastAPI server configuration doesn't have a very low timeout limit. Check your internet connection upstream bandwidth. If using Vertex AI, ensure the service account has `storage.objects.create` permissions if routing via GCS.

### 5. Groq Rate Limits (HTTP 429)
**Symptom:** API returns `429 Too Many Requests` during parallel agent execution.
**Fix:** The free tier of Groq has RPM (Requests Per Minute) limits. Implement exponential backoff in the backend Python HTTP client (e.g., using `tenacity`), or upgrade to a paid Groq tier.

---

## Makefile

Place this `Makefile` in the root of the project to simplify common tasks.

```makefile
.PHONY: dev frontend backend install test lint docker-build docker-up clean

# Run both frontend and backend in development mode
dev:
	@echo "Starting backend and frontend..."
	@make -j 2 backend frontend

frontend:
	cd frontend && npm run dev

backend:
	cd backend && source .venv/bin/activate && uv run uvicorn src.main:app --reload --port 8000

# Installation
install:
	cd frontend && npm install
	cd backend && uv venv && source .venv/bin/activate && uv sync

# Testing
test:
	cd backend && source .venv/bin/activate && pytest
	cd frontend && npm run test

# Formatting & Linting
lint:
	cd backend && source .venv/bin/activate && ruff check . && black --check .
	cd frontend && npm run lint

# Docker
docker-build:
	docker-compose build

docker-up:
	docker-compose up

# Clean environment
clean:
	rm -rf frontend/node_modules
	rm -rf frontend/.next
	rm -rf backend/.venv
	rm -rf backend/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} +
```
