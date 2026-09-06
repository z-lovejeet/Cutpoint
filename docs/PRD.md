# Cutpoint: Product Requirements Document (PRD)

## 1. Executive Summary
Cutpoint is a revolutionary analytics and intelligence platform designed specifically for YouTube content creators. At its core, the platform addresses one of the most persistent and frustrating mysteries in content creation: understanding exactly *why* viewers abandon a video at specific moments. While existing tools can tell a creator *where* audiences drop off, Cutpoint is the first platform to leverage advanced multimodal artificial intelligence—specifically Gemini 3.8 Flash—to explain *why* the drop-off occurs. By ingesting YouTube Analytics retention data, programmatically identifying the steepest cliffs in viewer retention, and applying multimodal AI analysis to the exact video frames corresponding to those cliffs, Cutpoint provides actionable, precise, and forensic-level insights. This empowers creators to fix pacing issues, refine their editing, improve storytelling, and ultimately boost audience retention, watch time, and channel growth.

## 2. Problem Statement
**The Core Pain Point:**
YouTube creators live and die by their Average View Duration (AVD) and Audience Retention metrics. The YouTube algorithm aggressively promotes videos that keep viewers on the platform. However, the current analytics paradigm is fundamentally broken. YouTube Studio provides a graph showing the percentage of viewers still watching at any given second. A creator can see a massive 15% drop-off at the 2:14 mark, but the graph offers absolutely zero context as to *why* that drop occurred. Was the joke not funny? Was the B-roll confusing? Was there a jarring audio transition? Did the topic shift too abruptly? 

Creators currently waste hundreds of hours manually scrubbing through their timelines, cross-referencing their analytics graphs with their video files, and guessing what went wrong. This is a highly unscientific, error-prone, and frustrating process.

**The Gap in Current Tools:**
- **YouTube Studio:** Shows *where* people leave, but not *why*. Requires manual scrubbing.
- **vidIQ & TubeBuddy:** Focus primarily on SEO (tags, titles, thumbnails) and high-level channel statistics. They do not analyze video content frame-by-frame against retention graphs.
- **General AI Tools (ChatGPT, Claude):** Cannot directly ingest private YouTube analytics data synced with video timestamps to provide multimodal analysis.

**Quantifying the Pain:**
A mid-sized creator uploads 4 videos a month. For each video, they might spend 2-3 hours analyzing retention dips to inform their next edit. That's 8-12 hours a month of tedious, manual analysis that still relies entirely on subjective guesswork.

## 3. Solution Overview
Cutpoint automates the entire process of retention analysis, transforming raw data into actionable intelligence.

**End-to-End Workflow:**
1. **Onboarding & Connection:** The user logs in via Supabase Auth and authenticates their YouTube channel using OAuth 2.0.
2. **Data Ingestion:** The platform fetches the user's latest videos and pulls the `audienceWatchRatio` (retention curve) data using the YouTube Analytics API.
3. **Cliff Detection:** A custom Python backend algorithm (utilizing NumPy/SciPy for first derivative calculation) analyzes the retention curve to identify "cliffs"—statistically significant, steep drops in audience retention within short time windows.
4. **Multimodal Analysis:** The original video file is uploaded to the Gemini Files API. Gemini 3.8 Flash is prompted to specifically analyze the visual, audio, and narrative content at the exact timestamps where the cliffs occurred.
5. **Report Generation:** Using a specialized structured output model (Groq GPT-OSS 20B), the platform generates a comprehensive "Forensic Report" that details the suspected root cause for each drop-off and provides prescriptive editing recommendations for future videos.
6. **Interactive Follow-up:** The user can interact with a Chat Agent (powered by Groq GPT-OSS 120B) that has full context of the report and the video, allowing for deep-dive Q&A (e.g., "How should I have transitioned that B-roll instead?").

## 4. Target Audience
**Primary Persona: The Solo Mid-Size Creator**
- **Demographics:** 20-35 years old, highly driven, full-time or aspiring full-time YouTuber.
- **Channel Size:** 10,000 to 500,000 subscribers.
- **Tech Literacy:** High. Familiar with video editing software (Premiere, Final Cut, DaVinci), analytics dashboards, and basic AI tools.
- **Pain Points:** Stagnating watch time, exhaustion from editing without clear ROI, feeling disconnected from audience preferences.
- **Budget:** Willing to pay $15-$30/month for a tool that guarantees increased AVD, as a 1% increase in retention can translate to thousands of extra views and AdSense revenue.

**Secondary Persona: Content Teams & Agencies**
- **Demographics:** Video editors, channel managers, or producers working for large creators (1M+ subs) or brand channels.
- **Tech Literacy:** Very high. Focused on workflow optimization.
- **Pain Points:** Need to quickly justify editing decisions to the main creator or client. Need reporting features to show value.
- **Budget:** Enterprise/Team pricing; budget is less of an issue if ROI is proven.

## 5. User Stories
1. **As a creator**, I want to securely connect my YouTube channel, so that the app can automatically access my video analytics without manual data entry.
2. **As a creator**, I want to see a dashboard of my recent videos with high-level health indicators (e.g., overall retention score), so that I can quickly decide which video needs analysis.
3. **As an analyst**, I want the system to automatically detect the exact timestamps of major audience drop-offs, so that I don't have to manually hunt for them in the YouTube Studio graph.
4. **As a user**, I want an AI to watch the specific moments where viewers left, so that I can get an objective, multimodal explanation of what went wrong.
5. **As an editor**, I want prescriptive recommendations on how to fix the mistakes identified at cliff moments, so that I can improve my pacing and editing in my next upload.
6. **As a user**, I want to chat directly with the AI about my report, so that I can ask specific follow-up questions about the recommendations (e.g., "Give me an example of a better hook").
7. **As a creator**, I want a beautifully formatted, easy-to-read forensic report, so that I can quickly digest the insights without feeling overwhelmed by raw data.
8. **As a new user**, I want to sign up easily using my Google account or email/password, so that I can access the tool immediately.
9. **As a privacy-conscious user**, I want my data to be protected and only visible to me, so that my channel analytics remain confidential.
10. **As a user**, I want to be able to look back at past analyses in a history log, so that I can track my improvement over time.

## 6. Feature List

### MUST-HAVE Features (MVP for Hackathon)
- **Authentication System:** Supabase Auth integrating Google OAuth and standard Email/Password login. Protected routes requiring active sessions.
- **YouTube OAuth Integration:** Dedicated flow to request read-only access to YouTube Analytics and Data API v3 on behalf of the user.
- **Dashboard:** A clean UI displaying a list of the user's recent videos fetched via the YouTube Data API, complete with thumbnails and basic stats.
- **Automated Data Fetching:** Backend service (Agent 1) that pulls the `audienceWatchRatio` array for a selected video from the YouTube Analytics API.
- **Cliff Detection Algorithm:** Mathematical module (Agent 2) using NumPy/SciPy to calculate the first derivative of the retention curve and identify local minima (cliffs).
- **Video Analysis Pipeline:** Integration with Gemini Files API to upload the video, and Gemini 3.8 Flash to analyze the specific cliff timestamps (Agent 3).
- **Forensic Report Generation:** LLM-powered generation (Agent 4 using Groq GPT-OSS 20B) of structured markdown reports containing root cause analysis and prescriptive recommendations.
- **AI Chat Popup:** A persistent or floating chat interface on the report page (Agent 5 using Groq GPT-OSS 120B) for follow-up Q&A, seeded with the context of the generated report.
- **Analysis History:** Database storage in Supabase PostgreSQL of past reports, allowing users to revisit previous analyses.
- **Responsive 3D UI:** Award-winning aesthetic using React Three Fiber, GSAP, and Tailwind CSS.

### NICE-TO-HAVE Features (Post-MVP / Stretch Goals)
- **Relative Retention Comparison:** Comparing the video's retention against videos of similar length across YouTube.
- **Batch Analysis:** Selecting multiple videos to analyze at once to identify channel-wide macro trends.
- **PDF/Notion Export:** One-click export of the forensic report to share with editors or stakeholders.
- **Email Digest:** Weekly automated emails summarizing the retention performance of the latest upload.
- **Brand Voice Learning:** The AI remembers past feedback and tailors recommendations to the creator's specific style over time.
- **Channel Benchmarking:** Tracking how cliff frequency changes over a 6-month period.

## 7. Pages & Navigation
1. **Landing/Home Page (`/`)**
   - **Purpose:** Sell the product, tell the story, drive sign-ups.
   - **Content:** 3D hero section built with React Three Fiber, scroll-driven animations explaining the "guessing game" of current analytics, clear CTA to sign up, pricing (mocked), and footer.
2. **About Page (`/about`)**
   - **Purpose:** Explain the tech stack and workflow.
   - **Content:** Technical showcase detailing how Gemini 3.8 Flash and the 5-Agent architecture work together to generate insights.
3. **Sign In (`/login`)**
   - **Purpose:** Existing user authentication.
   - **Content:** Clean glassmorphic form for Email/Password, and a prominent "Sign in with Google" button. Error handling and password reset links.
4. **Register (`/register`)**
   - **Purpose:** New user onboarding.
   - **Content:** Account creation form, terms of service agreement, and Google OAuth option.
5. **Dashboard (`/dashboard`)**
   - **Purpose:** The main user hub.
   - **Content:** List of connected channel's recent videos (thumbnails, titles, views). Status indicators (Analyzed vs. Unanalyzed). Links to past reports. Button to initiate a new analysis.
6. **Analysis Progress (`/dashboard/analysis/[id]`)**
   - **Purpose:** Keep the user engaged while the background agents do the heavy lifting.
   - **Content:** Real-time terminal-style or visually engaging progress indicators showing the 4 phases of execution (Fetching Data -> Detecting Cliffs -> AI Watching Video -> Generating Report).
7. **Report View (`/dashboard/report/[id]`)**
   - **Purpose:** Display the final insights.
   - **Content:** The detailed Forensic Report (markdown rendered beautifully). A video player synced to the cliff timestamps. A floating chat widget in the bottom right corner for follow-up Q&A.

## 8. Authentication Requirements
- **Provider:** Supabase Auth.
- **Methods:** Google OAuth (primary, required for YouTube API access eventually, though YouTube API access requires specific scopes handled either via Supabase or a secondary Google API client) and Email/Password.
- **Session Management:** `@supabase/ssr` must be used for Next.js App Router to handle cookie-based authentication securely across Server Components, Client Components, and Server Actions.
- **Middleware:** Next.js middleware must intercept requests to `/dashboard/*` to verify active sessions. Unauthenticated users must be redirected to `/login`.
- **Database Security:** Row-Level Security (RLS) must be enabled on all Supabase PostgreSQL tables (e.g., `reports`, `videos`) ensuring that `auth.uid()` matches the owner of the record.

## 9. Non-Functional Requirements
- **Performance:**
  - Frontend First Contentful Paint (FCP) under 1.5s.
  - Page transitions must be smooth (60fps) using Framer Motion.
  - The analysis pipeline is asynchronous; the UI must not block while the 5-minute analysis runs.
- **Security:**
  - Strict adherence to OAuth 2.0 best practices.
  - Secrets and API keys (Gemini, Groq, YouTube) must be stored in server-side environment variables and never exposed to the client.
- **Accessibility:**
  - ARIA labels on all interactive elements.
  - High contrast text (adhering to WCAG AA standards despite the dark theme).
  - Keyboard navigable forms.
- **Responsive Design:**
  - Fully functional on Desktop (1024px+). The primary use case is desktop.
  - Graceful degradation on Mobile (320px+). 3D elements may be simplified on mobile to save battery and rendering power.
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge) released within the last 2 years.

## 10. Success Criteria
To win the AI Content Engine Hackathon, the project must meet these criteria:
1. **End-to-End Functionality:** The user can log in, select a video, run the analysis, and receive a coherent, accurate multimodal report. (30% weight)
2. **Real World Usefulness:** The insights generated must be genuinely useful, not generic fluff. The cliff detection must accurately find the steep drops. (30% weight)
3. **Creativity & Design:** The application must look premium. The use of React Three Fiber and GSAP must elevate the experience beyond a standard SaaS dashboard. (20% weight)
4. **Technical Execution:** The 5-agent parallel pipeline must run cleanly. The codebase must be well-organized, typed (TypeScript), and thoroughly documented. (20% weight)
5. **Demo Readiness:** The app must survive a live demo without crashing. API limits must be accounted for gracefully.

## 11. Constraints
- **Hackathon Deadline:** September 8, 2026. Code freeze is strict.
- **YouTube API Quotas:**
  - `videos.insert` and `search.list`: 100 calls/day.
  - Default daily quota: 10,000 units/day. We must aggressively cache API responses in Supabase to avoid hitting limits during testing and demoing.
- **YouTube Analytics API Limits:** 200 requests/day. This is a severe bottleneck; the app must cache retention data and not re-fetch if recently pulled.
- **Cost:** All AI models are running via Vertex AI (Gemini) and Groq. While we have credits, excessive polling or massive context windows on the 120B model should be optimized.
- **Model Availability:** Must strictly use the specified Groq models (Sept 2026: gpt-oss-120b, gpt-oss-20b, compound, compound-mini). Llama and Mixtral are excluded.

## 12. Glossary
- **AVD (Average View Duration):** The average length of time a viewer watches a specific video.
- **Retention Curve / Audience Watch Ratio:** A graph showing the percentage of viewers who are still watching a video at every specific second.
- **Cliff:** A sharp, sudden drop in the retention curve, indicating a moment where a large number of viewers abandoned the video simultaneously.
- **Agent:** An isolated, specialized programmatic workflow (which may or may not use an LLM) designed to accomplish a single specific task in the pipeline.
- **Multimodal AI:** An AI model (like Gemini 3.8 Flash) capable of understanding and analyzing multiple types of input simultaneously (text, image, audio, video).
- **RLS (Row-Level Security):** A database security feature in PostgreSQL/Supabase that restricts which rows a user can read or write based on their authentication status.
