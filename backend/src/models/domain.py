from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class CliffSeverity(str, Enum):
    CRITICAL = "CRITICAL"  # >= 15% drop OR >= 10% in first 60s
    HIGH = "HIGH"          # 10-15% drop
    MEDIUM = "MEDIUM"      # 7-10% drop
    LOW = "LOW"            # 5-7% drop


class VideoMetadata(BaseModel):
    video_id: str
    title: str
    description: str = ""
    channel_id: str
    channel_name: str = ""
    duration_seconds: int = Field(gt=0)
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    published_at: str = ""
    thumbnail_url: str = ""


class RetentionDataPoint(BaseModel):
    time_ratio: float = Field(ge=0.0, le=1.0)
    watch_ratio: float = Field(ge=0.0)
    timestamp_seconds: float = Field(ge=0.0)


class RetentionData(BaseModel):
    video_id: str
    data_points: List[RetentionDataPoint] = Field(default_factory=list)
    average_retention: float = 0.0
    total_duration_seconds: float = 0.0
    quality_score: float = Field(default=1.0, ge=0.0, le=1.0)
    anomaly_flags: List[str] = Field(default_factory=list)


class CliffPoint(BaseModel):
    timestamp_start: float
    timestamp_end: float
    drop_percentage: float = Field(ge=5.0)
    severity: CliffSeverity
    retention_before: float
    retention_after: float
    position_in_video: str  # "early" (0-20%), "middle" (20-80%), "late" (80-100%)
    detection_methods: List[str] = Field(default_factory=list)
    detection_confidence: float = Field(ge=0.0, le=1.0)
    window_start: float = 0.0
    window_end: float = 0.0

    @field_validator("position_in_video")
    @classmethod
    def validate_position(cls, v: str) -> str:
        if v not in ("early", "middle", "late"):
            raise ValueError("position_in_video must be 'early', 'middle', or 'late'")
        return v


class Evidence(BaseModel):
    source_agent: str
    tool_name: str = ""
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    data_reference: Dict[str, Any] = Field(default_factory=dict)
    supports_hypothesis: bool = True


class InvestigationPass(BaseModel):
    pass_number: int
    agent_name: str
    hypothesis: str
    tools_used: List[str] = Field(default_factory=list)
    evidence_gathered: List[Evidence] = Field(default_factory=list)
    conclusion: str = ""
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)


class CliffAnalysis(BaseModel):
    cliff: CliffPoint
    investigation_passes: List[InvestigationPass] = Field(default_factory=list)
    evidence_chain: List[Evidence] = Field(default_factory=list)
    root_cause: str = ""
    visual_analysis: str = ""
    audio_analysis: str = ""
    pacing_analysis: str = ""
    content_analysis: str = ""
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.0)
    critic_approved: bool = False
    recommendations: List[str] = Field(default_factory=list)


class HealthScore(BaseModel):
    overall: float = Field(ge=0.0, le=100.0)
    grade: str = ""  # A-F
    content_score: float = Field(ge=0.0, le=100.0, default=50.0)
    pacing_score: float = Field(ge=0.0, le=100.0, default=50.0)
    audio_score: float = Field(ge=0.0, le=100.0, default=50.0)
    visual_score: float = Field(ge=0.0, le=100.0, default=50.0)
    hook_score: float = Field(ge=0.0, le=100.0, default=50.0)


class ActionItem(BaseModel):
    priority: str  # "P0", "P1", "P2"
    category: str  # "VISUAL", "AUDIO", "PACING", "SCRIPT", "HOOK"
    description: str
    expected_impact: str = ""
    related_cliff_timestamp: Optional[str] = None


class MethodologyNote(BaseModel):
    agents_involved: List[str] = Field(default_factory=list)
    total_debate_rounds: int = 0
    average_confidence: float = 0.0
    caveats: str = ""


class ForensicReport(BaseModel):
    report_id: str
    video: VideoMetadata
    health_score: HealthScore
    executive_summary: str = ""
    cliff_reports: List[CliffAnalysis] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
    positive_highlights: List[str] = Field(default_factory=list)
    methodology: MethodologyNote = Field(default_factory=MethodologyNote)
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def analysis_id(self) -> str:
        return self.report_id


class DetectionConfig(BaseModel):
    severity_threshold: float = 0.05
    smoothing_sigma: float = 2.0
    min_drop_percentage: float = 3.0
    max_cliffs: int = 5
    min_cliffs: int = 1
    window_size_ratio: float = 0.05
    z_score_threshold: float = -2.0


class DetectionResult(BaseModel):
    cliffs: List[CliffPoint] = Field(default_factory=list)
    config_used: DetectionConfig = Field(default_factory=DetectionConfig)
    iterations_needed: int = 1
    total_candidates_before_filter: int = 0


class DataIngestionResult(BaseModel):
    metadata: Optional[VideoMetadata] = None
    retention: Optional[RetentionData] = None
    fetch_duration_ms: int = 0
    quality_report: str = ""
