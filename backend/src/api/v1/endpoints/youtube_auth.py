"""
YouTube OAuth2 authentication endpoints for channel connection and token management.
"""
import logging
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse

from src.core.config import settings
from src.core.security import get_current_user
from src.models.api import YouTubeAuthResponse
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _build_google_auth_url(user_id: str) -> str:
    """Builds the Google OAuth 2.0 authorization URL."""
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        logger.warning("GOOGLE_CLIENT_ID is not configured.")
        return "http://localhost:3000/dashboard?auth=demo_connected"

    scopes = [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
    ]
    params = {
        "client_id": client_id,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": user_id,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


@router.get(
    "/auth/youtube",
    summary="Initiate Google OAuth redirect for YouTube channel connection",
)
async def get_youtube_auth_redirect(
    user_id: str = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Handles GET requests when creators click 'Connect YouTube Channel'.
    Directly redirects the browser to Google's OAuth consent screen.
    """
    target_user_id = user_id or current_user.get("user_id", "92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72")
    auth_url = _build_google_auth_url(target_user_id)
    return RedirectResponse(url=auth_url, status_code=307)


@router.post(
    "/auth/youtube",
    response_model=YouTubeAuthResponse,
    summary="Generate Google OAuth authorization URL for YouTube channel linking",
)
async def generate_youtube_auth_url(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Generates a secure Google OAuth 2.0 authorization URL for programmatic JSON callers.
    """
    auth_url = _build_google_auth_url(current_user["user_id"])
    return YouTubeAuthResponse(auth_url=auth_url)


@router.delete(
    "/auth/youtube",
    summary="Disconnect connected YouTube channel(s)",
)
async def disconnect_youtube(
    channel_id: Optional[str] = Query(None, description="Optional YouTube channel ID or UUID to disconnect. If omitted, disconnects all user channels."),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Disconnects the user's connected YouTube channel(s) by removing stored OAuth credentials.
    """
    user_id = current_user.get("user_id")
    is_guest = current_user.get("is_guest", False)

    if not is_guest and user_id:
        supabase_service.delete_user_channels(user_id, channel_id)
        logger.info("Successfully disconnected YouTube channel(s) for user %s (channel_id=%s)", user_id, channel_id)

    return {
        "success": True,
        "message": "YouTube channel disconnected successfully",
        "channel_id": channel_id,
    }


@router.get(
    "/auth/youtube/callback",
    summary="OAuth callback for Google authorization code exchange",
)
async def youtube_oauth_callback(
    code: str = Query(...),
    state: str = Query("guest-evaluator-id"),
):
    """
    Exchanges Google authorization code for access and refresh tokens,
    retrieves channel info, and saves it in Supabase youtube_channels table.
    """
    user_id = state or ""
    # Ensure user_id is a valid UUID
    try:
        import uuid
        uuid.UUID(str(user_id))
        valid_user_id = str(user_id)
    except Exception:
        valid_user_id = "92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72"

    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(token_url, data=payload)
            if resp.status_code != 200:
                logger.error("Token exchange failed (%d): %s", resp.status_code, resp.text)
                return RedirectResponse(url="http://localhost:3000/dashboard?error=oauth_failed")

            token_data = resp.json()
            access_token = token_data["access_token"]
            refresh_token = token_data.get("refresh_token", "")
            expires_in = token_data.get("expires_in", 3600)
            from datetime import datetime, timedelta, timezone
            expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

            # Fetch channel details from YouTube Data API
            ch_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            ch_data = ch_resp.json()
            items = ch_data.get("items", [])
            if items:
                ch = items[0]
                channel_id = ch["id"]
                channel_name = ch["snippet"]["title"]
                thumbnail = ch["snippet"]["thumbnails"]["default"]["url"]

                # Upsert into Supabase youtube_channels
                try:
                    supabase_service.client.table("youtube_channels").upsert({
                        "user_id": valid_user_id,
                        "channel_id": channel_id,
                        "channel_name": channel_name,
                        "channel_thumbnail": thumbnail,
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "token_expires_at": expires_at,
                    }, on_conflict="user_id,channel_id").execute()
                    logger.info("Successfully connected YouTube channel '%s' (%s) for user %s", channel_name, channel_id, valid_user_id)
                except Exception as dbe:
                    logger.warning("Could not persist YouTube channel record to Supabase: %s", dbe)

        return RedirectResponse(url="http://localhost:3000/dashboard?connected=true")

    except Exception as e:
        logger.error("YouTube OAuth callback error: %s", e)
        return RedirectResponse(url="http://localhost:3000/dashboard?error=callback_failed")
