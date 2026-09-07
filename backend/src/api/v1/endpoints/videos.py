"""
Videos endpoint for listing channel videos available for forensic retention analysis.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, Header

from src.core.security import get_current_user
from src.models.api import VideoListItem
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

DEMO_VIDEOS: List[VideoListItem] = [
    VideoListItem(
        video_id="M576WGiDBdQ",
        title="Why 99% of YouTube Hooks Fail in the First 15 Seconds",
        thumbnail_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
        published_at="2026-03-01T14:00:00Z",
        view_count=184500,
        duration="11m 42s",
    ),
    VideoListItem(
        video_id="y881t8ilMyc",
        title="Building an Autonomous Multi-Agent AI System From Scratch",
        thumbnail_url="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80",
        published_at="2026-02-18T10:30:00Z",
        view_count=428900,
        duration="18m 15s",
    ),
    VideoListItem(
        video_id="dQw4w9WgXcQ",
        title="The Engineering Behind High-Retention Educational Video",
        thumbnail_url="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&q=80",
        published_at="2026-01-25T16:00:00Z",
        view_count=792000,
        duration="14m 20s",
    ),
]


@router.get(
    "/videos",
    response_model=List[VideoListItem],
    summary="List videos from the user's connected YouTube channel",
)
async def list_channel_videos(
    current_user: Dict[str, Any] = Depends(get_current_user),
    x_guest_channel_disconnected: Optional[str] = Header(None, alias="X-Guest-Channel-Disconnected"),
):
    """
    Retrieves recent uploads from the user's connected YouTube channel,
    or supplies pre-cached demo videos for guest evaluation.
    """
    user_id = current_user["user_id"]
    is_guest = current_user.get("is_guest", False)

    # If guest has disconnected their channel, return empty list immediately
    if is_guest and x_guest_channel_disconnected == "true":
        return []

    try:
        channels = supabase_service.get_user_channels(user_id)
        if channels and channels[0].get("access_token"):
            ch = channels[0]
            token = ch["access_token"]
            # Call YouTube Data API for recent uploads
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params={
                        "part": "snippet",
                        "forMine": "true",
                        "type": "video",
                        "maxResults": 15,
                        "order": "date",
                    },
                    headers={"Authorization": f"Bearer {token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items: List[VideoListItem] = []
                    for it in data.get("items", []):
                        vid_id = it.get("id", {}).get("videoId", "")
                        snippet = it.get("snippet", {})
                        if vid_id:
                            items.append(
                                VideoListItem(
                                    video_id=vid_id,
                                    title=snippet.get("title", ""),
                                    thumbnail_url=snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                                    published_at=snippet.get("publishedAt", ""),
                                    view_count=0,
                                    duration="",
                                )
                            )
                    return items
        # If user is authenticated and has no channel connected, return empty list
        if not is_guest:
            return []
    except Exception as e:
        logger.warning("Could not fetch live YouTube video list: %s", e)
        if not is_guest:
            return []

    # Return demo catalog for guest evaluator sessions only
    return DEMO_VIDEOS
