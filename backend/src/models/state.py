from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AnalysisStatus(str, Enum):
    PENDING = "PENDING"
    FETCHING_DATA = "FETCHING_DATA"
    DETECTING_CLIFFS = "DETECTING_CLIFFS"
    INVESTIGATING = "INVESTIGATING"
    DEBATING = "DEBATING"
    GENERATING_REPORT = "GENERATING_REPORT"
    COMPLETE = "COMPLETE"
    ERROR = "ERROR"


class AgentMessage(BaseModel):
    sender: str
    recipient: str
    content: str
    message_type: str = "info"  # "info", "finding", "challenge", "approval", "rejection"
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InvestigationPlan(BaseModel):
    video_id: str
    total_cliffs: int
    cliff_ids: List[str] = Field(default_factory=list)
    priority_order: List[str] = Field(default_factory=list)
    strategy: str = "parallel"  # "parallel" or "sequential"
    required_confidence: float = 0.75
    rationale: str = ""


class AnalysisState(BaseModel):
    analysis_id: str
    video_id: str
    status: AnalysisStatus = AnalysisStatus.PENDING
    current_phase: str = ""
    progress_percentage: int = 0
    active_agents: List[str] = Field(default_factory=list)
    investigation_plan: Optional[InvestigationPlan] = None
    debate_rounds: int = 0
    agent_messages: List[AgentMessage] = Field(default_factory=list)
    error_message: Optional[str] = None
