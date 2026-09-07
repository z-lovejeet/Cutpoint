# Cutpoint: Zero-Cost Production Deployment Guide

Deploy the entire Cutpoint AI Content Engine (Frontend, Multi-Agent Backend, PostgreSQL Database, Auth, and AI Inference) **100% free with zero monthly cost** using the following production-grade stack.

---

## 1. Zero-Cost Production Architecture

| Component | Service | Free Tier Allowance | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** (Next.js 15 App Router) | **Vercel** | Unlimited edge deployments, SSL, global CDN, 100GB bandwidth | **$0.00** |
| **Backend** (FastAPI Multi-Agent Core) | **Render** or **Koyeb** | 750 free instance hours/month (24/7 uptime), automatic HTTPS | **$0.00** |
| **Database & Auth** | **Supabase** | 500 MB PostgreSQL, 50,000 MAU auth, daily backups, RLS | **$0.00** |
| **Visual & Audio Forensics** | **Google AI Studio** | Gemini 2.5/Flash: 15 RPM, 1M TPM, 1,500 requests/day | **$0.00** |
| **Report Synthesis & Chat** | **Groq Cloud** | Llama 3.3 70B & OpenAI GPT-OSS: generous free rate limits | **$0.00** |
| **YouTube Data & Analytics** | **Google Cloud Console** | 10,000 quota units/day via YouTube Data API v3 | **$0.00** |

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Database & Authentication (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a new free organization and project (e.g. `cutpoint-prod`).
2. Once provisioned, navigate to the **SQL Editor** in the Supabase Dashboard.
3. Open [`supabase/migrations/20260907000000_init_cutpoint_schema.sql`](../supabase/migrations/20260907000000_init_cutpoint_schema.sql), copy the entire SQL script, paste it into the SQL editor, and click **Run**.
4. In **Project Settings** -> **API**, copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key**
   - **service_role key** (keep secret!)

---

### Step 2: Deploy Multi-Agent Backend (Render)

1. Go to [render.com](https://render.com) and sign in with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository: `z-lovejeet/Cutpoint`.
4. Configure the service:
   - **Name**: `cutpoint-backend`
   - **Region**: Oregon (US West) or Frankfurt (EU)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install uv && uv pip install --system -r pyproject.toml`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Advanced** -> **Add Environment Variable** and add:

```ini
ENVIRONMENT=production
PORT=10000
FRONTEND_URL=https://<your-vercel-app>.vercel.app
BACKEND_CORS_ORIGINS=https://<your-vercel-app>.vercel.app,http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
GEMINI_API_KEY=<your-google-ai-studio-key>
GROQ_API_KEY=<your-groq-api-key>
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
GOOGLE_REDIRECT_URI=https://<your-render-backend-url>.onrender.com/api/v1/auth/youtube/callback
YOUTUBE_API_KEY=<your-youtube-data-api-key>
SECRET_KEY=<generate-a-random-32-character-secret>
```

6. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://cutpoint-backend.onrender.com`).

> **Tip to prevent free tier cold starts**: Free Render instances sleep after 15 minutes of inactivity. Set up a free 5-minute HTTP monitor on [cron-job.org](https://cron-job.org) or [uptimerobot.com](https://uptimerobot.com) targeting `https://cutpoint-backend.onrender.com/health` to keep it warm 24/7!

---

### Step 3: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import `z-lovejeet/Cutpoint`.
4. In project configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `frontend`
5. Expand **Environment Variables** and add:

```ini
NEXT_PUBLIC_API_URL=https://cutpoint-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

6. Click **Deploy**. Vercel will build and deploy your Next.js 15 App in ~60 seconds!

---

### Step 4: Finalize URLs & OAuth Whitelisting

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   - Under **APIs & Services** -> **Credentials** -> your OAuth 2.0 Client ID:
   - Add **Authorized JavaScript Origins**:
     - `https://<your-vercel-app>.vercel.app`
     - `http://localhost:3000`
   - Add **Authorized Redirect URIs**:
     - `https://<your-render-backend-url>.onrender.com/api/v1/auth/youtube/callback`
     - `https://<your-vercel-app>.vercel.app/auth/callback`
     - `http://localhost:8000/api/v1/auth/youtube/callback`
     - `http://localhost:3000/auth/callback`
2. **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
   - Set **Site URL**: `https://<your-vercel-app>.vercel.app`
   - Add **Redirect URLs**: `https://<your-vercel-app>.vercel.app/**`
3. **Render Environment Variables**:
   - Update `FRONTEND_URL` and `BACKEND_CORS_ORIGINS` with your exact live Vercel URL.

---

## 3. Pre-Deployment Verification Checklist

- [x] Next.js 15 standalone output enabled in `frontend/next.config.ts`.
- [x] Zero ESLint warnings or errors (`npm run lint`).
- [x] All 17 production routes compile and prerender (`npm run build`).
- [x] All 53 backend unit tests and multi-agent debate suites pass (`uv run pytest`).
- [x] Dockerfile available for containerized deployment (`backend/Dockerfile` and `frontend/Dockerfile`).
- [x] 1-Click Render blueprint configured (`render.yaml`).
- [x] Dynamic YouTube OAuth callback redirect using `FRONTEND_URL`.
- [x] Guest Sandbox Mode active for instant hackathon evaluation without mandatory YouTube credentials.
