from typing import Any, Dict, List, Optional

from supabase import Client, create_client

from src.core.config import settings


class SupabaseService:
    """Service wrapper for authenticated Supabase database operations."""

    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        if self._client is None:
            url = settings.NEXT_PUBLIC_SUPABASE_URL
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if not url or not key:
                raise ValueError(
                    "Supabase URL or Key is missing. Check NEXT_PUBLIC_SUPABASE_URL and "
                    "SUPABASE_SERVICE_ROLE_KEY in .env"
                )

            self._client = create_client(url, key)
        return self._client

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a user profile by ID."""
        response = self.client.table("profiles").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None

    def get_user_channels(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetches all connected YouTube channels for a user."""
        response = (
            self.client.table("youtube_channels")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data

    def create_analysis_record(
        self,
        user_id: str,
        video_id: str,
        video_title: str,
        channel_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a pending analysis record."""
        payload = {
            "user_id": user_id,
            "video_id": video_id,
            "video_title": video_title,
            "channel_id": channel_id,
            "status": "PENDING",
        }
        response = self.client.table("analyses").insert(payload).execute()
        return response.data[0] if response.data else None

    def update_analysis_status(
        self,
        analysis_id: str,
        status: str,
        report_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates the status and report payload of an analysis run."""
        payload: Dict[str, Any] = {"status": status}
        if report_data is not None:
            payload["report_data"] = report_data
        if error_message is not None:
            payload["error_message"] = error_message

        response = self.client.table("analyses").update(payload).eq("id", analysis_id).execute()
        return response.data[0] if response.data else None


supabase_service = SupabaseService()
