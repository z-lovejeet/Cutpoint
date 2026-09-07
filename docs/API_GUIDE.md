# Cutpoint API Reference Guide

This document details all external APIs integrated into Cutpoint. It provides explicit endpoints, authentication methods, rate limits, error handling matrices, and copy-paste-ready Python and TypeScript code examples for the AI coding agents to implement.

## Table of Contents
1. [YouTube Analytics API](#1-youtube-analytics-api)
2. [YouTube Data API v3](#2-youtube-data-api-v3)
3. [Google OAuth 2.0 Setup](#3-google-oauth-20-setup)
4. [Gemini 3.8 Flash API](#4-gemini-38-flash-api)
5. [Groq API](#5-groq-api)
6. [Supabase API](#6-supabase-api)
7. [API Error Handling Matrix](#7-api-error-handling-matrix)
8. [Rate Limit Management](#8-rate-limit-management)

---

## 1. YouTube Analytics API

The YouTube Analytics API is responsible for pulling the raw audience retention data (`audienceWatchRatio`) needed for cliff detection.

- **Base URL:** `https://youtubeanalytics.googleapis.com/v2`
- **Auth Method:** OAuth 2.0
- **Required Scope:** `https://www.googleapis.com/auth/yt-analytics.readonly`
- **Key Endpoint:** `GET /reports`
- **Rate Limit:** 200 requests/day (Default project quota)

### Request Parameters
- `ids`: `channel==MINE`
- `metrics`: `audienceWatchRatio`
- `dimensions`: `elapsedVideoTimeRatio`
- `filters`: `video==VIDEO_ID`
- `startDate`: Video publish date (YYYY-MM-DD)
- `endDate`: Current date (YYYY-MM-DD)

### Response Format
Returns a JSON object with a `rows` array containing `[timeRatio, watchRatio]` pairs.
`timeRatio` represents the percentage of the video duration (0.0 to 1.0).
`watchRatio` represents the percentage of the audience still watching at that point.

### Python Code Example

```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from datetime import datetime

def get_audience_retention_data(access_token: str, video_id: str, start_date: str):
    """
    Fetches the audience retention data (audienceWatchRatio) for a specific video.
    """
    credentials = Credentials(token=access_token)
    try:
        # Build the YouTube Analytics API client
        youtube_analytics = build("youtubeanalytics", "v2", credentials=credentials)

        end_date = datetime.now().strftime("%Y-%m-%d")

        # Call the API
        response = youtube_analytics.reports().query(
            ids="channel==MINE",
            startDate=start_date,
            endDate=end_date,
            metrics="audienceWatchRatio",
            dimensions="elapsedVideoTimeRatio",
            filters=f"video=={video_id}"
        ).execute()

        # Extract the data points
        if "rows" in response:
            return response["rows"] # List of [timeRatio, watchRatio]
        else:
            return []

    except HttpError as e:
        print(f"An HTTP error {e.resp.status} occurred: {e.content}")
        raise
```

---

## 2. YouTube Data API v3

Used to fetch video metadata (title, publish date, thumbnails) and channel details.

- **Base URL:** `https://www.googleapis.com/youtube/v3`
- **Auth Method:** OAuth 2.0
- **Required Scope:** `https://www.googleapis.com/auth/youtube.readonly`
- **Quota:** 10,000 units/day (Shared pool across methods).
  - `videos.list` = 1 unit
  - `search.list` = 100 calls/day dedicated bucket (do not exceed).

### Key Endpoints

1. **Video Metadata:** `GET /videos?part=snippet,statistics,contentDetails&id=VIDEO_ID`
2. **Channel Details:** `GET /channels?part=snippet,statistics&mine=true`
3. **List Videos:** `GET /search?part=snippet&channelId=CHANNEL_ID&type=video&order=date`

### Python Code Example

```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def get_video_metadata(access_token: str, video_id: str):
    credentials = Credentials(token=access_token)
    youtube = build("youtube", "v3", credentials=credentials)

    request = youtube.videos().list(
        part="snippet,statistics,contentDetails",
        id=video_id
    )
    response = request.execute()

    if "items" in response and len(response["items"]) > 0:
        return response["items"][0]
    return None

def get_channel_videos(access_token: str, channel_id: str, max_results: int = 10):
    credentials = Credentials(token=access_token)
    youtube = build("youtube", "v3", credentials=credentials)

    request = youtube.search().list(
        part="snippet",
        channelId=channel_id,
        type="video",
        order="date",
        maxResults=max_results
    )
    response = request.execute()
    return response.get("items", [])
```

---

## 3. Google OAuth 2.0 Setup

Because we use YouTube Analytics API, standard Supabase Auth with Google provider is NOT sufficient if we only get an ID token. We need an **Access Token** and a **Refresh Token** with specific scopes.

### Required Scopes
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `openid`
- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/yt-analytics.readonly`

### Google Cloud Console Setup Steps
1. Navigate to Google Cloud Console.
2. Create a new project: "Cutpoint".
3. Go to **APIs & Services > Library** and enable:
   - YouTube Data API v3
   - YouTube Analytics API
4. Go to **APIs & Services > OAuth consent screen**.
   - Choose "External".
   - Fill in App Name, User support email, Developer contact info.
   - Add the scopes listed above.
   - Add test users (if in testing mode).
5. Go to **APIs & Services > Credentials**.
   - Create Credentials -> OAuth client ID.
   - Application type: Web application.
   - Name: Cutpoint Web.
   - Authorized redirect URIs: `http://localhost:3000/auth/callback` (Dev) and `https://cutpoint.com/auth/callback` (Prod).
   - Save the `Client ID` and `Client Secret`.

### Token Management (Python Flow Example)
While Supabase will handle the frontend auth, the backend may need to manage tokens for background jobs if the access token expires.

```python
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

def refresh_google_access_token(refresh_token: str) -> dict:
    """
    Exchanges a refresh token for a new access token.
    """
    token_endpoint = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    response = requests.post(token_endpoint, data=payload)
    response.raise_for_status()
    
    # Returns a dict with 'access_token', 'expires_in', 'scope', 'token_type'
    return response.json()
```

---

## 4. Gemini 3.8 Flash API (Google AI Studio / Vertex AI)

Used by the **Multimodal Forensic Agent** (The Visual Detective) and the **Audio & Cadence Agent** (The Sound Engineer) for multimodal video and audio understanding. They use this API with function calling to dynamically investigate the video file, audio tracks, and timestamps of the detected cliffs to explain *why* the audience left.

- **Package:** `google-genai` (Python SDK)
- **Model:** `gemini-3.8-flash`
- **Rate Limits (Free Tier):** 15 Requests Per Minute (RPM), 1M Tokens Per Minute (TPM).

### The Files API
You must upload videos via the Files API before analysis. Max file size is 2GB. Video files require server-side processing by Google before they are `ACTIVE`.

### Code Example: Upload, Poll, Analyze

```python
import time
from google import genai
from pydantic import BaseModel
import os

# Initialize client (uses GEMINI_API_KEY env var)
client = genai.Client()

# Define the structured output schema we want from the Forensic Agent
class VisualInvestigationResult(BaseModel):
    visual_hypothesis: str
    tools_used: list[str]
    confidence_score: float

def analyze_video_cliff(file_path: str, timestamp_sec: float) -> VisualInvestigationResult:
    print(f"Uploading file: {file_path}")
    
    # 1. Upload the file
    video_file = client.files.upload(file=file_path)
    print(f"File uploaded. ID: {video_file.name}")
    
    # 2. Poll until state is ACTIVE
    while video_file.state.name == "PROCESSING":
        print(".", end="", flush=True)
        time.sleep(5)
        # Refresh file status
        video_file = client.files.get(name=video_file.name)
    
    if video_file.state.name == "FAILED":
        raise Exception("Video processing failed in Gemini API.")
        
    print("\nFile ready. Starting investigation...")
    
    # 3. Generate Content
    # Instruct the Multimodal Forensic Agent to investigate
    prompt = f"""
    Investigate this video specifically around the timestamp {timestamp_sec} seconds.
    There is a massive audience drop-off at this exact moment. 
    You are the Multimodal Forensic Agent. Use your visual inspection tools 
    (e.g., check for boring pacing, confusing transitions, awkward cuts) to form a hypothesis.
    """
    
    response = client.models.generate_content(
        model='gemini-3.8-flash',
        contents=[video_file, prompt],
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VisualInvestigationResult,
            temperature=0.4, # Lower temp for more analytical output
        ),
    )
    
    # 4. Cleanup: Delete the file after analysis to save quota
    client.files.delete(name=video_file.name)
    
    return response.text # This will be a JSON string matching VisualInvestigationResult
```

---

## 5. Groq API

Used for orchestration and reasoning across multiple agents: the **Supervisor Agent** (Lead Investigator), the **Retention Critic Agent** (The Skeptic), the **Report Synthesizer Agent** (GPT-OSS 20B), and the **Strategist Chat Agent** (GPT-OSS 120B).

- **Base URL:** `https://api.groq.com/openai/v1`
- **Auth:** Bearer token (`GROQ_API_KEY`)
- **Package:** `groq` Python package (OpenAI SDK compatible)

### Available Models
- `openai/gpt-oss-120b`: Flagship reasoning model. Use for the Supervisor Agent, Retention Critic Agent, and Strategist Chat Agent.
- `openai/gpt-oss-20b`: Fast, precise. Use for the Report Synthesizer Agent.
- `groq/compound-mini`: Fallback model.

### Code Example: Report Generation

```python
import os
from groq import Groq

# Uses GROQ_API_KEY env var
client = Groq()

def synthesize_final_report(verified_findings: str, video_title: str):
    system_prompt = (
        "You are the Report Synthesizer Agent (The Executive Editor). "
        "Format the provided verified multi-agent analysis into a professional, compelling, "
        "and easy-to-read forensic report using Markdown. Ensure formatting is perfect."
    )
    
    user_prompt = f"Video: {video_title}\n\nVerified Findings Data:\n{verified_findings}"
    
    completion = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=2048,
    )
    
    return completion.choices[0].message.content
```

---

## 6. Supabase API

Used for authentication (Google OAuth), user sessions, and storing historical reports in PostgreSQL.

- **Stack:** `@supabase/ssr` (Next.js App Router)

### Next.js Server Client Example (`utils/supabase/server.ts`)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch (error) {}
        },
      },
    }
  )
}
```

### Sign In with Google (Client Side)
```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const handleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      redirectTo: `${location.origin}/auth/callback`,
    },
  })
}
```

### Database RLS Policy Example
```sql
-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own reports
CREATE POLICY "Users can view own reports" 
ON reports FOR SELECT 
USING (auth.uid() = user_id);

-- Allow backend service to insert reports
CREATE POLICY "Service role can insert reports" 
ON reports FOR INSERT 
WITH CHECK (true);
```

---

## 7. API Error Handling Matrix

| API | HTTP Code | Error Meaning | Remediation Strategy |
|---|---|---|---|
| YouTube Analytics | 401 | `Unauthorized` | Refresh the Google access token using the refresh token stored in the DB. |
| YouTube Analytics | 403 | `Forbidden` (Quota Exceeded) | Halt Data Ingestion Agent. Queue job for next UTC day. Notify user via UI. |
| YouTube Data | 404 | `Not Found` | Video was deleted or made private. Remove from processing queue. |
| Gemini Files | 400 | `File too large` / `Invalid format` | Validate file locally before upload. Ensure < 2GB and standard video format (mp4). |
| Gemini Content | 429 | `Too Many Requests` (Rate Limit) | Implement exponential backoff. Max 15 RPM. Pause execution for 60s. |
| Gemini Content | 500 | `Internal Server Error` | Retry up to 3 times with 5s delay. |
| Groq | 429 | `Rate limit reached` | Implement exponential backoff. Switch to `compound-mini` if retry fails 3x. |
| Groq | 401 | `Invalid API Key` | Alert admin immediately. Halt processing. |
| Supabase | 400 | `Invalid Auth credentials` | Prompt user to re-authenticate via OAuth. |

---

## 8. Rate Limit Management

To ensure we do not exhaust our quotas, especially the strict YouTube API quotas and Gemini free tier, the system employs the following strategies:

### 1. Request Caching (Database)
- **YouTube Metadata:** Store video titles, thumbnails, and durations in the Supabase `videos` table upon first fetch. Only re-fetch if older than 7 days.
- **YouTube Analytics Data:** Cache the raw retention JSON array in the database. If a user requests a re-analysis, use the cached data instead of hitting the YouTube Analytics API again.

### 2. Task Queue & Batching (Python Backend)
- **Gemini Rate Limit:** 15 RPM. The python `asyncio` task queue must implement a semaphore:
  ```python
  import asyncio
  
  # Max 10 concurrent requests to Gemini to stay well under the 15 RPM limit
  gemini_semaphore = asyncio.Semaphore(10)
  
  async def safe_gemini_call(file_path, prompt):
      async with gemini_semaphore:
          # execute API call
          pass
  ```

### 3. Exponential Backoff implementation
For all external API calls, use the `tenacity` library in Python:

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from googleapiclient.errors import HttpError
import logging

logging.basicConfig(level=logging.INFO)

# Retry only on 429 (Rate Limit) or 5xx errors
def should_retry_http_error(exception):
    if isinstance(exception, HttpError):
        return exception.resp.status in [429, 500, 502, 503, 504]
    return False

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: logging.warning(f"Retrying after error: {retry_state.outcome.exception()}")
)
def fetch_with_backoff():
    # your api call here
    pass
```

### 4. Dedicated Buckets
- YouTube `search.list` has a strict 100 calls/day dedicated bucket. We only call this when a user first signs up to populate their dashboard. For updates, we rely on webhooks if possible, or a single daily sync cron job per active user.
