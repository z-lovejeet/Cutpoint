"""
YouTube Data and Analytics API service client.
Handles video metadata retrieval, granular audience retention curves,
OAuth token refresh, and data quality scoring.
"""
import logging
import re
from typing import Any, Dict, List, Optional

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.core.config import settings
from src.models.domain import RetentionData, RetentionDataPoint, VideoMetadata
from src.services.supabase_service import supabase_service
from src.utils.rate_limiter import with_semaphore, youtube_semaphore

logger = logging.getLogger(__name__)


def parse_iso8601_duration(duration_str: str) -> int:
    """Parses ISO 8601 duration (e.g., PT1H2M30S, PT5M12S, PT45S) into total seconds."""
    if not duration_str:
        return 0
    pattern = re.compile(
        r"P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?"
    )
    match = pattern.match(duration_str)
    if not match:
        return 0
    parts = match.groupdict()
    days = int(parts.get("days") or 0)
    hours = int(parts.get("hours") or 0)
    minutes = int(parts.get("minutes") or 0)
    seconds = int(parts.get("seconds") or 0)
    return days * 86400 + hours * 3600 + minutes * 60 + seconds


class YouTubeService:
    """Async client for YouTube Data API v3 and YouTube Analytics API v2."""

    def __init__(self):
        self.data_api_base = "https://www.googleapis.com/youtube/v3"
        self.analytics_api_base = "https://youtubeanalytics.googleapis.com/v2"
        self.token_url = "https://oauth2.googleapis.com/token"

    async def refresh_access_token(self, channel_record: Dict[str, Any]) -> str:
        """Refreshes an expired OAuth access token using the stored refresh token."""
        refresh_token = channel_record.get("refresh_token")
        if not refresh_token:
            raise ValueError("No refresh_token found in channel record.")

        payload = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self.token_url, data=payload)
            if resp.status_code != 200:
                logger.error("Failed to refresh Google OAuth token: %s", resp.text)
                raise RuntimeError(f"OAuth token refresh failed: {resp.status_code} {resp.text}")

            token_data = resp.json()
            new_access_token = token_data["access_token"]

            # Update Supabase channel record
            try:
                supabase_service.client.table("youtube_channels").update({
                    "access_token": new_access_token,
                }).eq("id", channel_record["id"]).execute()
            except Exception as e:
                logger.warning("Failed to persist refreshed access token to Supabase: %s", e)

            return new_access_token

    async def fetch_video_oembed(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Fetches public video metadata via YouTube oEmbed without requiring an API key."""
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://www.youtube.com/oembed",
                    params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning("YouTube oEmbed fetch failed for %s: %s", video_id, e)
        return None

    @with_semaphore(youtube_semaphore)
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(httpx.HTTPStatusError),
        reraise=True,
    )
    async def fetch_video_metadata(self, video_id: str, access_token: Optional[str] = None) -> VideoMetadata:
        """Fetches video details via YouTube Data API v3, with oEmbed fallback."""
        try:
            params = {
                "id": video_id,
                "part": "snippet,statistics,contentDetails",
            }
            headers = {}
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
            elif settings.YOUTUBE_API_KEY:
                params["key"] = settings.YOUTUBE_API_KEY
            else:
                logger.warning("Neither access_token nor YOUTUBE_API_KEY provided; attempting oEmbed first.")

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"{self.data_api_base}/videos", params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            items = data.get("items", [])
            if items:
                item = items[0]
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                content_details = item.get("contentDetails", {})
                duration_iso = content_details.get("duration", "PT0S")
                duration_seconds = max(1, parse_iso8601_duration(duration_iso))

                thumbnails = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbnails.get("maxres", {}).get("url")
                    or thumbnails.get("high", {}).get("url")
                    or thumbnails.get("default", {}).get("url")
                    or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                )

                return VideoMetadata(
                    video_id=video_id,
                    title=snippet.get("title", f"Video {video_id}"),
                    description=snippet.get("description", ""),
                    channel_id=snippet.get("channelId", ""),
                    channel_name=snippet.get("channelTitle", ""),
                    duration_seconds=duration_seconds,
                    view_count=int(stats.get("viewCount", 0)),
                    like_count=int(stats.get("likeCount", 0)),
                    comment_count=int(stats.get("commentCount", 0)),
                    published_at=snippet.get("publishedAt", ""),
                    thumbnail_url=thumb_url,
                )
        except Exception as api_err:
            logger.warning("Data API metadata lookup failed for %s (%s). Attempting oEmbed fallback...", video_id, api_err)

        # Fallback to public oEmbed
        oembed = await self.fetch_video_oembed(video_id)
        if oembed and oembed.get("title"):
            return VideoMetadata(
                video_id=video_id,
                title=oembed["title"],
                description="",
                channel_id="",
                channel_name=oembed.get("author_name", "YouTube Creator"),
                duration_seconds=600,
                view_count=0,
                like_count=0,
                comment_count=0,
                published_at="",
                thumbnail_url=oembed.get("thumbnail_url", f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
            )

        raise ValueError(f"Video {video_id} metadata could not be retrieved from YouTube.")

    @with_semaphore(youtube_semaphore)
    async def fetch_retention_data(
        self,
        video_id: str,
        channel_record: Dict[str, Any],
        duration_seconds: int = 600,
    ) -> RetentionData:
        """
        Fetches granular retention curve via YouTube Analytics API.
        Autonomously refreshes access token on HTTP 401.
        """
        access_token = channel_record.get("access_token", "")
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "ids": "channel==MINE",
            "metrics": "audienceWatchRatio",
            "dimensions": "elapsedVideoTimeRatio",
            "filters": f"video=={video_id}",
            "startDate": "2000-01-01",
            "endDate": "2030-01-01",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(f"{self.analytics_api_base}/reports", params=params, headers=headers)

            # Handle token expiry
            if resp.status_code == 401:
                logger.info("Access token expired. Refreshing token for channel %s...", channel_record.get("id"))
                access_token = await self.refresh_access_token(channel_record)
                headers["Authorization"] = f"Bearer {access_token}"
                resp = await client.get(f"{self.analytics_api_base}/reports", params=params, headers=headers)

            if resp.status_code != 200:
                logger.warning("Analytics API returned status %s: %s", resp.status_code, resp.text)
                raise RuntimeError(f"YouTube Analytics API error: {resp.status_code} {resp.text}")

            data = resp.json()

        rows = data.get("rows", [])
        points: List[RetentionDataPoint] = []
        for row in rows:
            time_ratio = float(row[0])
            watch_ratio = float(row[1])
            points.append(
                RetentionDataPoint(
                    time_ratio=time_ratio,
                    watch_ratio=watch_ratio,
                    timestamp_seconds=round(time_ratio * duration_seconds, 2),
                )
            )

        # Sort points by elapsed time ratio
        points.sort(key=lambda p: p.time_ratio)

        retention = RetentionData(
            video_id=video_id,
            data_points=points,
            total_duration_seconds=float(duration_seconds),
        )
        self.validate_retention_quality(retention)
        return retention

    def validate_retention_quality(self, data: RetentionData) -> float:
        """
        Evaluates the quality and completeness of retention data points.
        Returns a score from 0.0 to 1.0 and populates anomaly_flags.
        """
        score = 1.0
        flags: List[str] = []
        points = data.data_points

        if not points:
            data.quality_score = 0.0
            data.anomaly_flags = ["EMPTY_DATA"]
            return 0.0

        if len(points) < 50:
            score -= 0.3
            flags.append("LOW_RESOLUTION")

        watch_ratios = [p.watch_ratio for p in points]
        if all(w == 0.0 for w in watch_ratios):
            data.quality_score = 0.0
            data.anomaly_flags = ["ALL_ZERO_RETENTION"]
            return 0.0

        if any(w > 2.5 for w in watch_ratios):
            score -= 0.3
            flags.append("IMPOSSIBLE_SPIKE_DETECTED")

        # Check for large time gaps (>10% gap between consecutive points)
        for i in range(1, len(points)):
            if points[i].time_ratio - points[i - 1].time_ratio > 0.10:
                score -= 0.2
                flags.append("LARGE_TEMPORAL_GAPS")
                break

        data.quality_score = max(0.0, min(1.0, round(score, 2)))
        data.anomaly_flags = list(set(flags))
        if points:
            data.average_retention = round(sum(watch_ratios) / len(watch_ratios), 4)
        return data.quality_score


youtube_service = YouTubeService()
