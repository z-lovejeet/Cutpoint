# Multi-Agent System Design Document

This document outlines the architecture, specifications, and implementation details for the multi-agent system powering **Cutpoint**. The system utilizes a specialized, parallelized workflow to analyze YouTube retention data, detect audience drop-off points (cliffs), perform multimodal analysis of the video at those points, and generate actionable forensic reports.

---

## 1. Agent System Overview

### Why a Multi-Agent Architecture?
Cutpoint operates on complex, multi-modal data streams: numeric time-series data from YouTube Analytics, visual and audio context from video files, and structured textual reports. A single LLM prompt cannot handle this end-to-end pipeline effectively due to context window limitations, latency constraints, and the need for specialized processing (e.g., mathematical operations).

By decomposing the pipeline into specialized agents, we achieve:
- **Separation of Concerns:** Each agent is optimized for a single task (e.g., pure math vs. multimodal reasoning).
- **Optimal Model Selection:** We route specific tasks to the best-suited models (Gemini 3.8 Flash for video, Groq GPT-OSS 20B for fast formatting, Groq GPT-OSS 120B for deep reasoning).
- **Reduced Latency:** Parallel execution allows non-dependent tasks to run concurrently.

### Parallel Execution Strategy
The orchestrator leverages Python's `asyncio` to run independent phases concurrently:
- **Phase 1 (Parallel):** Fetch YouTube Data (Agent 1) runs simultaneously with Uploading the Video to Gemini (Agent 3, Step 1).
- **Phase 2 (Parallel):** Detect Cliffs (Agent 2) runs simultaneously with Gemini processing the video (Agent 3 waiting for ACTIVE state).
- **Phase 3 (Sequential):** Video Analyzer (Agent 3, Step 2) analyzes specific cliff timestamps.
- **Phase 4 (Sequential):** Report Generator (Agent 4) compiles all data into the final output.

### Why Pure `asyncio` over LangGraph or CrewAI?
For this hackathon project, we eschew heavy agent frameworks like LangGraph or CrewAI in favor of pure Python `asyncio`.
1. **Simplicity & Speed:** Frameworks add abstraction layers that slow down execution and complicate debugging. Pure `asyncio` is closer to the metal and highly performant.
2. **Predictable State Management:** We use a well-defined Pydantic model (`AnalysisState`) passed between functions, avoiding the "black box" state management of some agent frameworks.
3. **Engineering Elegance:** Judges appreciate clean, standard Python engineering over framework bloat, demonstrating a deep understanding of concurrent execution and API orchestration.

---

## 2. Agent Roster

| Agent Name | Role | Core Technology / LLM | Inputs | Outputs |
|---|---|---|---|---|
| **Agent 1: Data Fetcher** | Retrieves analytics and metadata | Pure API (No LLM) | `video_id`, `oauth_token` | `RetentionData`, `VideoMetadata` |
| **Agent 2: Cliff Detector** | Mathematically finds drop-offs | NumPy/SciPy (No LLM) | `RetentionData` | `List[CliffPoint]` |
| **Agent 3: Video Analyzer** | Multimodal analysis of cliffs | Gemini 3.8 Flash | `video_file`, `List[CliffPoint]` | `List[CliffAnalysis]` |
| **Agent 4: Report Generator** | Creates final structured report | Groq GPT-OSS 20B | `Metadata`, `Cliffs`, `Analyses`| `ForensicReport` |
| **Agent 5: Chat Agent** | Follow-up Q&A on report | Groq GPT-OSS 120B | `ForensicReport`, `user_query` | Text Response |
| **Orchestrator** | Manages pipeline and state | Python `asyncio` | Trigger Event | `AnalysisState` |

---

## 3. Agent 1: Data Fetcher

### Detailed Specification
- **Purpose:** Fetch YouTube Analytics retention data + video metadata.
- **LLM:** None (pure API calls).
- **Input:** `video_id` (string), `oauth_token` (string).
- **Output:**
  - `RetentionData`: A time-series representation of `audienceWatchRatio`.
  - `VideoMetadata`: Title, duration, views, published date, etc.
- **YouTube Analytics API call:** `reports.query` with `metrics=audienceWatchRatio`, `dimensions=elapsedVideoTimeRatio`.
- **YouTube Data API call:** `videos.list` with `part=snippet,statistics,contentDetails`.
- **Error handling:** Token refresh, quota exceeded, video not found.

### Implementation

```python
import aiohttp
import asyncio
from pydantic import BaseModel
from typing import List, Optional

class VideoMetadata(BaseModel):
    video_id: str
    title: str
    duration_iso: str
    views: int
    channel_id: str

class RetentionPoint(BaseModel):
    elapsed_ratio: float
    watch_ratio: float

class RetentionData(BaseModel):
    video_id: str
    points: List[RetentionPoint]

class DataFetcherAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.data_api_url = "https://www.googleapis.com/youtube/v3/videos"
        self.analytics_api_url = "https://youtubeanalytics.googleapis.com/v2/reports"

    async def fetch_metadata(self, video_id: str, session: aiohttp.ClientSession) -> VideoMetadata:
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": self.api_key
        }
        async with session.get(self.data_api_url, params=params) as response:
            if response.status != 200:
                raise Exception(f"YouTube Data API error: {response.status}")
            
            data = await response.json()
            if not data.get("items"):
                raise ValueError("Video not found")
                
            item = data["items"][0]
            return VideoMetadata(
                video_id=video_id,
                title=item["snippet"]["title"],
                duration_iso=item["contentDetails"]["duration"],
                views=int(item["statistics"]["viewCount"]),
                channel_id=item["snippet"]["channelId"]
            )

    async def fetch_retention(self, video_id: str, oauth_token: str, session: aiohttp.ClientSession) -> RetentionData:
        headers = {"Authorization": f"Bearer {oauth_token}"}
        params = {
            "ids": "channel==MINE",
            "metrics": "audienceWatchRatio",
            "dimensions": "elapsedVideoTimeRatio",
            "filters": f"video=={video_id}",
            "startDate": "2000-01-01",  # YouTube Analytics requires arbitrary start/end dates
            "endDate": "2030-01-01"
        }
        
        async with session.get(self.analytics_api_url, headers=headers, params=params) as response:
            if response.status == 401:
                raise PermissionError("OAuth token expired or invalid")
            elif response.status != 200:
                error_body = await response.text()
                raise Exception(f"YouTube Analytics API error: {response.status} - {error_body}")
                
            data = await response.json()
            rows = data.get("rows", [])
            
            points = [
                RetentionPoint(elapsed_ratio=float(row[0]), watch_ratio=float(row[1]))
                for row in rows
            ]
            
            return RetentionData(video_id=video_id, points=points)

    async def run(self, video_id: str, oauth_token: str) -> tuple[VideoMetadata, RetentionData]:
        async with aiohttp.ClientSession() as session:
            # Run both API calls in parallel
            metadata_task = self.fetch_metadata(video_id, session)
            retention_task = self.fetch_retention(video_id, oauth_token, session)
            
            metadata, retention = await asyncio.gather(metadata_task, retention_task)
            return metadata, retention
```

---

## 4. Agent 2: Cliff Detector

### Detailed Specification
- **Purpose:** Mathematically identify significant drops in viewer retention.
- **LLM:** None (NumPy/SciPy based).
- **Input:** `RetentionData`
- **Output:** `List[CliffPoint]` containing timestamp, drop_percentage, severity, and context windows.
- **Algorithm:**
  1. Extract `watch_ratio` as a NumPy array.
  2. Apply a light Gaussian filter to smooth noise.
  3. Calculate the first derivative (difference between adjacent points).
  4. Find local minima in the derivative array (points where the drop is steepest).
  5. Filter by a severity threshold (e.g., >5% absolute drop within a small window).
  6. Map back to real timestamps based on `elapsed_ratio` and video duration.

### Implementation

```python
import numpy as np
from scipy.ndimage import gaussian_filter1d
from pydantic import BaseModel
from typing import List
from .utils import parse_iso_duration # Assumed utility function

class CliffPoint(BaseModel):
    timestamp_seconds: int
    drop_percentage: float
    severity: str # "LOW", "MEDIUM", "HIGH"
    window_start: int
    window_end: int

class CliffDetectorAgent:
    def __init__(self, severity_threshold: float = 0.05, smoothing_sigma: float = 2.0):
        self.severity_threshold = severity_threshold
        self.smoothing_sigma = smoothing_sigma

    def calculate_cliffs(self, retention: RetentionData, duration_seconds: int) -> List[CliffPoint]:
        if not retention.points:
            return []

        ratios = np.array([p.elapsed_ratio for p in retention.points])
        retentions = np.array([p.watch_ratio for p in retention.points])

        # Smooth the curve to avoid micro-fluctuations
        smoothed = gaussian_filter1d(retentions, sigma=self.smoothing_sigma)
        
        # Calculate first derivative
        derivative = np.gradient(smoothed)
        
        # Find points where the derivative is notably negative
        cliffs = []
        
        # Simple local minima detection on derivative
        for i in range(1, len(derivative) - 1):
            if derivative[i] < derivative[i-1] and derivative[i] < derivative[i+1]:
                drop = smoothed[i-1] - smoothed[i+1] # Drop over local window
                
                if drop > self.severity_threshold:
                    time_sec = int(ratios[i] * duration_seconds)
                    
                    if drop > 0.15: severity = "HIGH"
                    elif drop > 0.10: severity = "MEDIUM"
                    else: severity = "LOW"
                    
                    cliffs.append(CliffPoint(
                        timestamp_seconds=time_sec,
                        drop_percentage=round(drop * 100, 2),
                        severity=severity,
                        window_start=max(0, time_sec - 10),
                        window_end=min(duration_seconds, time_sec + 15)
                    ))
                    
        # Sort by severity (largest drop first)
        cliffs.sort(key=lambda x: x.drop_percentage, reverse=True)
        return cliffs[:5] # Return top 5 cliffs

    def run(self, retention: RetentionData, metadata: VideoMetadata) -> List[CliffPoint]:
        duration_sec = parse_iso_duration(metadata.duration_iso)
        return self.calculate_cliffs(retention, duration_sec)

# Example Input Data:
# Points: [(0.0, 1.0), (0.01, 0.95), (0.02, 0.94), (0.03, 0.80), (0.04, 0.79)...]
# Drop at 0.03 is 14% (0.94 to 0.80).
# If duration is 600s, 0.03 is 18s. Window: 8s to 33s.
```

---

## 5. Agent 3: Video Analyzer

### Detailed Specification
- **Purpose:** Leverage Gemini 3.8 Flash's native multimodal capabilities to watch the video at specific drop-off points and explain *why* viewers left.
- **LLM:** Gemini 3.8 Flash (Vertex AI or AI Studio).
- **Input:** Video file path, `List[CliffPoint]`.
- **Output:** `List[CliffAnalysis]` with structured root causes and recommendations.
- **Process:**
  1. Upload video using `google.genai` Files API.
  2. Poll until `state=ACTIVE`.
  3. Send a prompt for each cliff, explicitly referencing timestamps.

### EXACT Gemini Prompt Template
```text
You are an expert YouTube audience retention analyst.
Review the provided video between {window_start} seconds and {window_end} seconds.
At exactly {timestamp} seconds, the audience retention drops significantly by {drop_percentage}%.

Analyze this segment visually and audibly to determine WHY viewers left.
Look for:
- Pacing issues (too slow, dead air)
- Boring visuals or lack of b-roll
- Audio issues (poor quality, sudden noises)
- Content issues (tangents, confusing explanations, failure to deliver the hook)

Return your analysis strictly in the requested JSON format.
```

### Implementation

```python
import asyncio
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

class CliffAnalysis(BaseModel):
    timestamp_seconds: int
    root_cause: str = Field(description="The primary reason viewers left.")
    visual_analysis: str = Field(description="Analysis of on-screen elements.")
    audio_analysis: str = Field(description="Analysis of speech, music, or pacing.")
    recommendations: List[str] = Field(description="Actionable steps to fix this in future videos.")

class VideoAnalyzerAgent:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-3.8-flash"

    async def upload_video(self, file_path: str) -> str:
        # Step 1: Upload
        # In a real async environment, we might run this in a threadpool
        loop = asyncio.get_event_loop()
        uploaded_file = await loop.run_in_executor(None, self.client.files.upload, file=file_path)
        
        # Step 2: Poll
        while True:
            file_info = await loop.run_in_executor(None, self.client.files.get, name=uploaded_file.name)
            if file_info.state == "ACTIVE":
                break
            elif file_info.state == "FAILED":
                raise Exception("Video processing failed in Gemini.")
            await asyncio.sleep(2)
            
        return uploaded_file.name

    async def analyze_cliff(self, file_name: str, cliff: CliffPoint) -> CliffAnalysis:
        prompt = f"""
        You are an expert YouTube audience retention analyst.
        Review the provided video between {cliff.window_start} seconds and {cliff.window_end} seconds.
        At exactly {cliff.timestamp_seconds} seconds, the audience retention drops significantly by {cliff.drop_percentage}%.

        Analyze this segment visually and audibly to determine WHY viewers left.
        Look for pacing issues, boring visuals, poor audio, or content tangents.
        """
        
        loop = asyncio.get_event_loop()
        
        # Use structured outputs
        response = await loop.run_in_executor(
            None,
            lambda: self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_uri(file_uri=file_name, mime_type="video/mp4"),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CliffAnalysis,
                ),
            )
        )
        
        # Parse JSON to Pydantic
        import json
        data = json.loads(response.text)
        data['timestamp_seconds'] = cliff.timestamp_seconds
        return CliffAnalysis(**data)

    async def run(self, file_path: str, cliffs: List[CliffPoint]) -> List[CliffAnalysis]:
        file_name = await self.upload_video(file_path)
        
        # Analyze all cliffs in parallel using asyncio
        tasks = [self.analyze_cliff(file_name, cliff) for cliff in cliffs]
        analyses = await asyncio.gather(*tasks)
        
        return list(analyses)
```

---

## 6. Agent 4: Report Generator

### Detailed Specification
- **Purpose:** Synthesize raw data, cliff points, and multimodal analyses into a polished, professional forensic report.
- **LLM:** Groq GPT-OSS 20B (`openai/gpt-oss-20b`). Chosen for extremely fast generation of structured text.
- **Input:** `VideoMetadata`, `List[CliffPoint]`, `List[CliffAnalysis]`.
- **Output:** `ForensicReport`

### EXACT Groq Prompt Template
```text
System: You are an expert YouTube content strategist writing a Forensic Retention Report.
Given the video metadata and analysis of specific viewer drop-off points, generate a comprehensive report.
Output MUST be valid JSON conforming to the requested schema.

User:
Title: {title}
Duration: {duration}
Views: {views}

Drop-off Analysis:
{json_encoded_cliff_analyses}

Provide an executive summary, map the cliff reports, assign an overall health score (0-100), and provide 3-5 global action items.
```

### Implementation

```python
import os
import json
from groq import AsyncGroq
from pydantic import BaseModel
from typing import List

class ForensicReport(BaseModel):
    executive_summary: str
    overall_health_score: int
    cliff_reports: List[dict] # Will contain merged CliffPoint and CliffAnalysis data
    action_items: List[str]

class ReportGeneratorAgent:
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "openai/gpt-oss-20b"

    async def run(self, metadata: VideoMetadata, cliffs: List[CliffPoint], analyses: List[CliffAnalysis]) -> ForensicReport:
        # Merge data for context
        merged_data = []
        for cliff in cliffs:
            analysis = next((a for a in analyses if a.timestamp_seconds == cliff.timestamp_seconds), None)
            if analysis:
                merged_data.append({
                    "timestamp": cliff.timestamp_seconds,
                    "drop": cliff.drop_percentage,
                    "severity": cliff.severity,
                    "root_cause": analysis.root_cause,
                    "visuals": analysis.visual_analysis,
                    "audio": analysis.audio_analysis,
                    "fixes": analysis.recommendations
                })

        prompt = f"""
        Video Title: {metadata.title}
        Views: {metadata.views}
        
        Drop-off Analyses:
        {json.dumps(merged_data, indent=2)}
        
        Generate a cohesive forensic retention report.
        """

        # In production, use Groq's JSON mode if available, or strictly prompt for JSON
        response = await self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You output JSON matching the ForensicReport schema."},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            response_format={"type": "json_object"}
        )
        
        result_json = json.loads(response.choices[0].message.content)
        return ForensicReport(**result_json)
```

---

## 7. Agent 5: Chat Agent

### Detailed Specification
- **Purpose:** Answer follow-up user questions based on the generated report.
- **LLM:** Groq GPT-OSS 120B (`openai/gpt-oss-120b`). Chosen for flagship reasoning over large context.
- **Trigger:** Interactive chat UI.
- **Context:** The full `ForensicReport` is injected as a system message to ground the model.

### EXACT System Prompt
```text
You are an elite YouTube strategist assistant. 
You are discussing a Forensic Retention Report with the creator.
Use the following report context to answer their questions accurately. Be encouraging but direct.

REPORT CONTEXT:
{report_json}
```

### 5 Example Q&A Pairs
1. **User:** Why did everyone leave at 1:20?
   **Agent:** At 1:20 (80s), the report shows a 14% drop. The analysis indicates you went on a tangent about your sponsor without a smooth transition, causing viewers to click away.
2. **User:** How can I improve my health score?
   **Agent:** Your current score is 65. To improve it, focus on the top action items: cut dead air in the first 30 seconds and use b-roll during complex explanations to maintain visual pacing.
3. **User:** Was the lighting bad at the end?
   **Agent:** The report doesn't mention lighting issues specifically, but it does note that the visuals became static at the 5:00 mark. Adding motion or changing angles might help more than adjusting the light.
4. **User:** Should I cut the intro completely?
   **Agent:** Yes, the drop-off at 0:15 suggests your 20-second logo intro is hurting retention. Try a cold open with a hook instead.
5. **User:** What's the biggest issue with this video?
   **Agent:** The most severe cliff was a 22% drop at 3:45. This occurred because the main payoff was revealed too early, leaving viewers with no reason to watch the remainder of the video.

### Implementation

```python
from groq import AsyncGroq
from typing import List, Dict

class ChatAgent:
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "openai/gpt-oss-120b"
        
    async def chat(self, report: ForensicReport, message_history: List[Dict[str, str]], new_message: str) -> str:
        system_prompt = f"""
        You are an elite YouTube strategist assistant.
        REPORT CONTEXT:
        {report.model_dump_json(indent=2)}
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(message_history)
        messages.append({"role": "user", "content": new_message})
        
        response = await self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            temperature=0.7
        )
        
        return response.choices[0].message.content
```

---

## 8. Orchestrator

### Detailed Specification
- **Purpose:** Coordinates the pipeline, manages state, handles errors.
- **Implementation:** pure `asyncio`.

```python
import asyncio
from pydantic import BaseModel
from typing import Optional, List

class AnalysisState(BaseModel):
    video_id: str
    status: str = "PENDING"
    metadata: Optional[VideoMetadata] = None
    retention: Optional[RetentionData] = None
    cliffs: List[CliffPoint] = []
    analyses: List[CliffAnalysis] = []
    report: Optional[ForensicReport] = None
    error: Optional[str] = None

class Orchestrator:
    def __init__(self, keys: dict):
        self.fetcher = DataFetcherAgent(keys['youtube'])
        self.detector = CliffDetectorAgent()
        self.analyzer = VideoAnalyzerAgent(keys['gemini'])
        self.reporter = ReportGeneratorAgent(keys['groq'])

    async def run_pipeline(self, video_id: str, oauth_token: str, file_path: str) -> AnalysisState:
        state = AnalysisState(video_id=video_id)
        
        try:
            state.status = "FETCHING_AND_UPLOADING"
            # Phase 1: Parallel API fetch and Video Upload initialization
            fetch_task = self.fetcher.run(video_id, oauth_token)
            upload_task = self.analyzer.upload_video(file_path)
            
            (metadata, retention), file_name = await asyncio.gather(fetch_task, upload_task)
            state.metadata = metadata
            state.retention = retention
            
            state.status = "DETECTING_CLIFFS"
            # Phase 2: Detect cliffs locally
            state.cliffs = self.detector.run(retention, metadata)
            
            state.status = "ANALYZING_VIDEO"
            # Phase 3: Wait for video to be ACTIVE, then analyze
            # (Note: upload_video already polled for ACTIVE state in our implementation)
            state.analyses = await self.analyzer.run(file_path, state.cliffs) # Modified to use file_name internally
            
            state.status = "GENERATING_REPORT"
            # Phase 4: Final generation
            state.report = await self.reporter.run(state.metadata, state.cliffs, state.analyses)
            
            state.status = "COMPLETED"
            
        except Exception as e:
            state.status = "FAILED"
            state.error = str(e)
            
        return state
```

---

## 9. LLM Router / Fallback Strategy

To ensure reliability, the system implements a routing and fallback strategy based on the Sept 2026 availability on Groq and Vertex AI.

1. **Multimodal Analysis:** 
   - **Primary:** Gemini 3.8 Flash (via Vertex AI)
   - **Fallback:** If Gemini fails or hits quotas, fallback to `qwen/qwen3-vl-32b-instruct` on Groq (if visual) or extract audio via `whisper-large-v3` and pass text to GPT-OSS 120B.
2. **Report Generation:**
   - **Primary:** `openai/gpt-oss-20b` (fastest structured output).
   - **Fallback:** `groq/compound-mini` (fast single tool invocation to parse schema).
3. **Chat Agent:**
   - **Primary:** `openai/gpt-oss-120b` (best reasoning).
   - **Fallback:** `groq/compound` (agentic fallback if deep reasoning pipeline fails).

Rate limit errors (429) trigger a 3-second backoff and a swap to the fallback model on the second attempt.

---

## 10. Inter-Agent Communication

Because we are not using a framework like CrewAI, agents do not send "messages" to each other directly. Instead, data flows strictly through the **Orchestrator** using a typed shared state (`AnalysisState`). 

- **Data Flow:** Function Returns -> Orchestrator -> Function Arguments.
- **Benefits:** This guarantees deterministic execution. Agent 4 cannot start until Agent 3 returns its strictly-typed Pydantic list.
- **Traceability:** The `AnalysisState` object acts as a complete snapshot of the system at any given point, which can easily be serialized to Supabase PostgreSQL or logged to a dashboard.
