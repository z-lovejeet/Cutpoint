from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

from src.utils.youtube_url import sanitize_video_id_or_raise


class AnalysisRequest(BaseModel):
    video_id: str = Field(min_length=1, max_length=200)

    @field_validator("video_id")
    @classmethod
    def validate_and_normalize_video_id(cls, v: str) -> str:
        return sanitize_video_id_or_raise(v)


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    message: str = "Analysis pipeline queued."


class AnalysisStatusResponse(BaseModel):
    analysis_id: str
    status: str
    progress_percentage: int = 0
    current_phase: str = ""
    active_agents: List[str] = Field(default_factory=list)
    debate_rounds: int = 0
    error_message: Optional[str] = None
    agent_messages: List[Dict[str, Any]] = Field(default_factory=list)
    investigation_plan: Optional[Dict[str, Any]] = None
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class ReportListItem(BaseModel):
    analysis_id: str
    video_id: str
    video_title: str
    status: str
    overall_health_score: Optional[float] = None
    grade: Optional[str] = None
    created_at: str


class ChatRequest(BaseModel):
    analysis_id: str
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: str


class YouTubeAuthResponse(BaseModel):
    auth_url: str


class VideoListItem(BaseModel):
    video_id: str
    title: str
    thumbnail_url: str = ""
    published_at: str = ""
    view_count: int = 0
    duration: str = ""
