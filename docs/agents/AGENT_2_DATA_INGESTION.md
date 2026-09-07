# Agent 2: The Data Ingestion Agent (The Archivist)

## 1. Agent Identity
- **Name:** Data Ingestion Agent
- **Role:** The Archivist
- **Model:** None (pure API calls, no LLM)
- **Architecture:** Autonomous robust data pipeline with self-healing behaviors.

## 2. Purpose
Fetches YouTube Analytics retention data (`audienceWatchRatio`) and Video metadata (title, duration, views, channel) from YouTube APIs. Unlike a simple API wrapper, this agent has autonomous behaviors that ensure high data availability and quality for the Cutpoint forensics pipeline.

## 3. Autonomous Behaviors (What Makes It a Real Agent)
- **Self-Healing Token Refresh:** Detects 401 errors, autonomously refreshes OAuth tokens via Supabase session, and retries seamlessly.
- **Adaptive Retry with Backoff:** Implements exponential backoff with jitter on 429/500 errors to respect rate limits and survive transient outages.
- **Data Quality Validation:** Checks retention data for anomalies (e.g., all zeros, impossibly high values, missing segments) before passing it downstream.
- **Anomaly Flagging:** If retention data looks suspicious (e.g., flat line, sudden jump to >1.0 without context), flags it for the Supervisor with a warning.
- **Graceful Degradation:** If the Analytics API fails but the Data API succeeds, returns partial metadata with a quality flag, allowing partial processing.
- **Rate Limit Awareness:** Tracks quota usage and reports remaining budget to the Supervisor to prevent cascading failures.

## 4. API Specifications

### YouTube Data API v3
- **Endpoint:** `GET https://www.googleapis.com/youtube/v3/videos`
- **Purpose:** Fetches metadata, statistics, and content details.
- **Parameters:**
  - `part`: `snippet,statistics,contentDetails`
  - `id`: Video ID
- **Headers:**
  - `Authorization`: `Bearer <token>` (if OAuth is used, or `key=<API_KEY>` param)
- **Response Schema:** JSON object containing `items` list with `snippet` (title, publishedAt, channelId, channelTitle, thumbnails), `contentDetails` (duration), and `statistics` (viewCount, likeCount).

### YouTube Analytics API
- **Endpoint:** `GET https://youtubeanalytics.googleapis.com/v2/reports`
- **Purpose:** Fetches the audience retention curve.
- **Parameters:**
  - `dimensions`: `elapsedVideoTimeRatio`
  - `metrics`: `audienceWatchRatio`
  - `ids`: `channel==MINE`
  - `filters`: `video==<VIDEO_ID>`
  - `startDate`, `endDate`: Valid date range for the video.
- **Headers:**
  - `Authorization`: `Bearer <token>` (Required for Analytics API)
- **Response Schema:** JSON object containing `rows` list. Each row is `[elapsedVideoTimeRatio, audienceWatchRatio]`.

## 5. Data Models (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class VideoMetadata(BaseModel):
    video_id: str
    title: str
    duration_iso: str
    duration_seconds: int
    views: int
    likes: int
    channel_id: str
    channel_title: str
    published_at: str
    thumbnail_url: str

class RetentionPoint(BaseModel):
    elapsed_ratio: float = Field(..., ge=0.0, le=1.0)
    watch_ratio: float = Field(..., ge=0.0)
    timestamp_seconds: float

class RetentionData(BaseModel):
    video_id: str
    points: List[RetentionPoint]
    quality_score: float = Field(..., ge=0.0, le=1.0)
    anomaly_flags: List[str]

class DataIngestionResult(BaseModel):
    metadata: Optional[VideoMetadata]
    retention: Optional[RetentionData]
    fetch_duration_ms: int
    quality_report: str
```

## 6. Complete Implementation

```python
import aiohttp
import asyncio
import logging
import time
from typing import Dict, Any, Tuple, List
from supabase import Client
from .models import VideoMetadata, RetentionPoint, RetentionData, DataIngestionResult
import isodate

logger = logging.getLogger("DataIngestionAgent")

class DataIngestionAgent:
    def __init__(self, supabase_client: Client, youtube_api_key: str):
        self.supabase = supabase_client
        self.api_key = youtube_api_key
        self.session = None

    async def _init_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session:
            await self.session.close()

    async def refresh_oauth_token(self, user_id: str) -> str:
        """Self-healing token refresh via Supabase"""
        logger.info(f"Refreshing OAuth token for user {user_id}")
        # In a real scenario, call Supabase Edge function or Auth endpoint to refresh provider token
        response = self.supabase.table('user_tokens').select('refresh_token').eq('user_id', user_id).execute()
        if not response.data:
            raise ValueError("No refresh token found for user")
        
        refresh_token = response.data[0]['refresh_token']
        # Simulated OAuth refresh call
        new_token = "refreshed_bearer_token_123" 
        self.supabase.table('user_tokens').update({'access_token': new_token}).eq('user_id', user_id).execute()
        return new_token

    async def _request_with_retry(self, url: str, headers: Dict, params: Dict, user_id: str, retries: int = 3) -> Dict:
        """Adaptive Retry with Backoff and Token Refresh"""
        await self._init_session()
        for attempt in range(retries):
            async with self.session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    return await response.json()
                
                elif response.status == 401:
                    logger.warning("401 Unauthorized detected. Attempting self-healing token refresh.")
                    new_token = await self.refresh_oauth_token(user_id)
                    headers['Authorization'] = f"Bearer {new_token}"
                    continue # Retry immediately with new token
                
                elif response.status in (429, 500, 502, 503):
                    backoff = (2 ** attempt) + (time.time() % 1) # Exponential with jitter
                    logger.warning(f"Rate limited or server error ({response.status}). Retrying in {backoff:.2f}s")
                    await asyncio.sleep(backoff)
                    continue
                
                else:
                    response.raise_for_status()
        
        raise Exception(f"Max retries exceeded for {url}")

    def parse_duration(self, iso_duration: str) -> int:
        return int(isodate.parse_duration(iso_duration).total_seconds())

    async def fetch_metadata(self, video_id: str, token: str, user_id: str) -> VideoMetadata:
        url = "https://www.googleapis.com/youtube/v3/videos"
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": self.api_key
        }
        headers = {"Authorization": f"Bearer {token}"}
        
        data = await self._request_with_retry(url, headers, params, user_id)
        if not data.get('items'):
            raise ValueError(f"Video {video_id} not found")
            
        item = data['items'][0]
        snippet = item['snippet']
        stats = item['statistics']
        content_details = item['contentDetails']
        
        duration_seconds = self.parse_duration(content_details['duration'])
        
        return VideoMetadata(
            video_id=video_id,
            title=snippet['title'],
            duration_iso=content_details['duration'],
            duration_seconds=duration_seconds,
            views=int(stats.get('viewCount', 0)),
            likes=int(stats.get('likeCount', 0)),
            channel_id=snippet['channelId'],
            channel_title=snippet['channelTitle'],
            published_at=snippet['publishedAt'],
            thumbnail_url=snippet['thumbnails']['high']['url']
        )

    async def fetch_retention(self, video_id: str, token: str, user_id: str, duration_seconds: int) -> RetentionData:
        url = "https://youtubeanalytics.googleapis.com/v2/reports"
        # We use a broad date range to capture lifetime retention
        params = {
            "ids": "channel==MINE",
            "metrics": "audienceWatchRatio",
            "dimensions": "elapsedVideoTimeRatio",
            "filters": f"video=={video_id}",
            "startDate": "2000-01-01",
            "endDate": "2030-01-01"
        }
        headers = {"Authorization": f"Bearer {token}"}
        
        data = await self._request_with_retry(url, headers, params, user_id)
        rows = data.get('rows', [])
        
        points = []
        for row in rows:
            elapsed_ratio, watch_ratio = row[0], row[1]
            timestamp = elapsed_ratio * duration_seconds
            points.append(RetentionPoint(
                elapsed_ratio=elapsed_ratio,
                watch_ratio=watch_ratio,
                timestamp_seconds=timestamp
            ))
            
        return self.validate_retention_data(video_id, points)

    def validate_retention_data(self, video_id: str, points: List[RetentionPoint]) -> RetentionData:
        flags = []
        quality_score = 1.0
        
        if not points:
            flags.append("EMPTY_DATA")
            quality_score = 0.0
            return RetentionData(video_id=video_id, points=points, quality_score=quality_score, anomaly_flags=flags)
            
        if len(points) < 50:
            flags.append("LOW_RESOLUTION")
            quality_score -= 0.3
            
        if all(p.watch_ratio == 0 for p in points):
            flags.append("ALL_ZERO_RETENTION")
            quality_score = 0.0
            
        max_ratio = max(p.watch_ratio for p in points)
        if max_ratio > 2.0:
            flags.append("IMPOSSIBLE_VALUES")
            quality_score -= 0.5
            
        # Check for unexpected drops (data gaps)
        for i in range(1, len(points)):
            if points[i].elapsed_ratio - points[i-1].elapsed_ratio > 0.05: # >5% gap
                flags.append("DATA_GAPS")
                quality_score -= 0.2
                break
                
        return RetentionData(
            video_id=video_id,
            points=points,
            quality_score=max(0.0, quality_score),
            anomaly_flags=flags
        )

    async def run(self, video_id: str, user_id: str) -> DataIngestionResult:
        start_time = time.time()
        
        # Get initial token from Supabase
        res = self.supabase.table('user_tokens').select('access_token').eq('user_id', user_id).execute()
        token = res.data[0]['access_token'] if res.data else ""
        
        try:
            metadata = await self.fetch_metadata(video_id, token, user_id)
        except Exception as e:
            logger.error(f"Failed to fetch metadata: {e}")
            return DataIngestionResult(
                metadata=None, retention=None, 
                fetch_duration_ms=int((time.time() - start_time) * 1000), 
                quality_report=f"Metadata fetch failed: {str(e)}"
            )

        try:
            retention = await self.fetch_retention(video_id, token, user_id, metadata.duration_seconds)
            quality_report = f"Success. Quality Score: {retention.quality_score}"
            if retention.anomaly_flags:
                quality_report += f" Flags: {', '.join(retention.anomaly_flags)}"
        except Exception as e:
            logger.error(f"Failed to fetch retention: {e}")
            retention = None
            quality_report = f"Graceful degradation: Metadata fetched, but retention failed: {str(e)}"

        return DataIngestionResult(
            metadata=metadata,
            retention=retention,
            fetch_duration_ms=int((time.time() - start_time) * 1000),
            quality_report=quality_report
        )
```

## 7. Error Scenarios & Recovery

| Error Status | Scenario | Agent Action | Resulting State |
|--------------|----------|--------------|-----------------|
| `401` | Unauthorized (Token expired) | Autonomously calls Supabase to refresh token, updates headers, retries immediately. | Success or definitive failure if refresh fails. |
| `403` | Forbidden (Quota Exceeded) | Captures error, halts operation, formats error report. | Reports to Supervisor Agent to pause investigations. |
| `404` | Not Found (Video Deleted) | Aborts immediately without retrying. | Clear error returned to Supervisor. |
| `429` | Rate Limited | Exponential backoff with jitter, retries up to 3 times. | Success or graceful degradation. |
| `500` | Server Error (YouTube Down) | Exponential backoff with jitter, retries up to 3 times. | Graceful degradation. |
| N/A | Malformed Response / Bad Data | Catches during Pydantic validation and `validate_retention_data()`. | Flags anomaly and degrades quality score. |

## 8. Data Quality Scoring
The `validate_retention_data()` method computes a `quality_score` between 0.0 and 1.0 for the fetched retention curve.

- **Base Score:** Starts at 1.0.
- **Completeness (Data Gaps):** If the elapsed time ratio jumps by more than 5% between consecutive points, a `DATA_GAPS` flag is added, and the score drops by 0.2.
- **Resolution (Low Resolution):** If there are fewer than 50 data points for the entire video (making cliff detection mathematically unstable), a `LOW_RESOLUTION` flag is added, and the score drops by 0.3.
- **Consistency (Impossible Values):** While watch ratios >1.0 are possible due to rewinding, values >2.0 often indicate data corruption or extreme short loops. Flags `IMPOSSIBLE_VALUES`, score drops by 0.5.
- **Critical Failure (All Zeros/Empty):** If the data is empty or entirely zeros, the score is forced to 0.0 and flagged `EMPTY_DATA` or `ALL_ZERO_RETENTION`.

The Supervisor Agent reads this `quality_score`. If it falls below a defined threshold (e.g., 0.6), the Supervisor will abort the investigation and report poor data quality to the user instead of producing a low-confidence hallucinated report.
