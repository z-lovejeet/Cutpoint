"""
Security and authentication utilities for FastAPI endpoints.
Validates Supabase JWTs and seamlessly supports Guest / Judge mode evaluation.
"""
import logging
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.config import settings

logger = logging.getLogger(__name__)

# Optional bearer auth to permit Guest mode requests
bearer_scheme = HTTPBearer(auto_error=False)

GUEST_USER = {
    "user_id": "92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72",
    "email": "judge@cutpoint.engine",
    "display_name": "Hackathon Evaluator",
    "is_guest": True,
}


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    x_guest_session: Optional[str] = Header(None, alias="X-Guest-Session"),
) -> Dict[str, Any]:
    """
    Validates Supabase JWT bearer token or authorizes Guest Evaluator session.
    """
    # 1. Check guest evaluation header or token
    if x_guest_session == "true" or (credentials and credentials.credentials == "guest-evaluator-token"):
        return GUEST_USER

    # 2. If no bearer token provided, check if in development/demo mode
    if not credentials:
        # If development environment, allow guest fallback
        if settings.ENVIRONMENT == "development":
            return GUEST_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Special guest token shortcut
    if token == "guest" or token == "guest-session":
        return GUEST_USER

    # 3. Validate against Supabase auth API
    supabase_url = settings.NEXT_PUBLIC_SUPABASE_URL
    anon_key = settings.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if not supabase_url or not anon_key:
        logger.warning("Supabase credentials missing in config. Permitting user in dev mode.")
        return GUEST_USER

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon_key,
                },
            )

        if resp.status_code == 200:
            user_data = resp.json()
            return {
                "user_id": user_data.get("id"),
                "email": user_data.get("email", ""),
                "display_name": user_data.get("user_metadata", {}).get("full_name", ""),
                "is_guest": False,
            }
        else:
            logger.warning("Supabase auth verification failed (%d): %s", resp.status_code, resp.text)
            if settings.ENVIRONMENT == "development":
                return GUEST_USER
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except httpx.RequestError as e:
        logger.error("Supabase auth connection error: %s", e)
        if settings.ENVIRONMENT == "development":
            return GUEST_USER
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable.",
        )
