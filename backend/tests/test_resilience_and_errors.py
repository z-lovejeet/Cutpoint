"""
Resilience, error handling, and edge-case test suite for Cutpoint.
Validates system stability when external APIs (YouTube, Gemini, Groq) fail,
ensures graceful fallback degraded mode, and tests edge-case retention signals.
"""
from unittest.mock import patch

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from src.agents.archivist import archivist_agent
from src.agents.mathematician import mathematician_agent
from src.agents.skeptic import skeptic_agent
from src.agents.sound_engineer import sound_engineer_agent
from src.agents.visual_detective import visual_detective_agent
from src.main import app
from src.models.domain import (
    CliffPoint,
    CliffSeverity,
    RetentionData,
    RetentionDataPoint,
    VideoMetadata,
)
from src.utils.rate_limiter import GeminiQuotaExceededError


@pytest.fixture
def mock_metadata():
    return VideoMetadata(
        video_id="test_resilience_vid",
        title="Resilience and Error Handling Benchmark",
        channel_id="UC_resilience",
        channel_name="Benchmark Studio",
        duration_seconds=300,
    )


# ---------------------------------------------------------------------------
# 1. External API Quota & Failure Fallbacks
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_archivist_resilience_on_youtube_api_failure():
    """Verifies that Archivist falls back to synthetic retention when YouTube API raises HTTP errors."""
    with patch("src.services.youtube_service.youtube_service.fetch_video_metadata", side_effect=httpx.HTTPError("Quota Exceeded")):
        res = await archivist_agent.ingest("test_quota_vid", user_id="92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72")
        assert res.metadata is not None
        assert res.retention is not None
        assert len(res.retention.data_points) >= 50
        assert "fallback" in res.quality_report.lower() or "demo" in res.quality_report.lower() or res.quality_score > 0.5


@pytest.mark.asyncio
async def test_visual_detective_fallback_on_gemini_quota_error(mock_metadata):
    """Verifies that Visual Detective falls back cleanly when Gemini 18 RPD quota is reached."""
    cliff = CliffPoint(
        timestamp_start=30.0,
        timestamp_end=40.0,
        retention_before=85.0,
        retention_after=70.0,
        drop_percentage=15.0,
        severity=CliffSeverity.CRITICAL,
        position_in_video="early",
        detection_methods=["smoothed_gradient"],
        detection_confidence=0.88,
        window_start=25.0,
        window_end=45.0,
    )
    points = [RetentionDataPoint(time_ratio=i / 100, watch_ratio=0.8, timestamp_seconds=float(i * 3)) for i in range(101)]

    with patch("src.services.gemini_service.gemini_service.analyze_with_tools", side_effect=GeminiQuotaExceededError("Daily limit reached")):
        analysis = await visual_detective_agent.investigate_cliff(cliff, mock_metadata, points)
        assert analysis is not None
        assert analysis.root_cause != ""
        assert analysis.confidence_score >= 0.70
        assert len(analysis.evidence_chain) >= 2


@pytest.mark.asyncio
async def test_skeptic_fallback_on_groq_api_failure(mock_metadata):
    """Verifies that Skeptic Critic uses algorithmic audit heuristics if Groq API throws an error."""
    cliff = CliffPoint(
        timestamp_start=45.0,
        timestamp_end=55.0,
        retention_before=80.0,
        retention_after=68.0,
        drop_percentage=12.0,
        severity=CliffSeverity.HIGH,
        position_in_video="early",
        detection_methods=["smoothed_gradient"],
        detection_confidence=0.85,
        window_start=40.0,
        window_end=60.0,
    )
    points = [RetentionDataPoint(time_ratio=i / 100, watch_ratio=0.75, timestamp_seconds=float(i * 3)) for i in range(101)]
    visual_res = await visual_detective_agent.investigate_cliff(cliff, mock_metadata, points)
    audio_res = await sound_engineer_agent.investigate_cliff(cliff, mock_metadata, points)

    with patch("src.services.groq_service.groq_service.chat_completion", side_effect=RuntimeError("Groq 503 Overloaded")):
        verdict = await skeptic_agent.review_finding(cliff, visual_res, audio_res, debate_round=1)
        assert verdict is not None
        assert "action" in verdict
        assert verdict["action"] in ("APPROVE", "CHALLENGE")
        assert "calibrated_confidence" in verdict
        assert 0.0 <= float(verdict["calibrated_confidence"]) <= 1.0


# ---------------------------------------------------------------------------
# 2. Extreme Retention Curve Edge Cases
# ---------------------------------------------------------------------------
def test_mathematician_edge_case_perfectly_flat_curve():
    """Verifies that a perfectly flat retention curve produces zero false-positive cliff detections."""
    flat_points = [
        RetentionDataPoint(time_ratio=i / 100, watch_ratio=0.85, timestamp_seconds=float(i * 3))
        for i in range(101)
    ]
    retention = RetentionData(video_id="flat_vid", data_points=flat_points, total_duration_seconds=300.0)
    result = mathematician_agent.detect_cliffs(retention)
    assert len(result.cliffs) == 0


def test_mathematician_edge_case_immediate_cliff():
    """Verifies detection when audience collapses in the opening 5 seconds."""
    points = []
    for s in range(100):
        val = 0.95 if s < 3 else 0.40  # Catastrophic drop in first 3s
        points.append(RetentionDataPoint(time_ratio=s / 100, watch_ratio=val, timestamp_seconds=float(s * 3)))

    retention = RetentionData(video_id="crash_vid", data_points=points, total_duration_seconds=300.0)
    result = mathematician_agent.detect_cliffs(retention)
    assert len(result.cliffs) >= 1
    assert result.cliffs[0].severity in (CliffSeverity.CRITICAL, CliffSeverity.HIGH)


def test_mathematician_edge_case_noisy_oscillation():
    """Verifies that debouncing prevents spamming dozens of cliffs on high-frequency noise."""
    import math
    points = []
    for s in range(200):
        # 0.5% oscillation around 70% retention
        val = 0.70 + (0.01 * math.sin(s))
        points.append(RetentionDataPoint(time_ratio=s / 200, watch_ratio=val, timestamp_seconds=float(s * 2)))

    retention = RetentionData(video_id="noisy_vid", data_points=points, total_duration_seconds=400.0)
    result = mathematician_agent.detect_cliffs(retention)
    # Oscillation below 5% threshold must produce 0 cliffs
    assert len(result.cliffs) == 0


# ---------------------------------------------------------------------------
# 3. HTTP API Error Contract Verification
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_api_invalid_video_id_validation():
    """Verifies that invalid or malformed video IDs return HTTP 422 Unprocessable Entity."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/analyze",
            json={"video_id": "not_a_valid_youtube_url_or_id"},
            headers={"X-Guest-Session": "true"},
        )
    assert resp.status_code == 422
    data = resp.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_api_nonexistent_analysis_status_returns_404():
    """Verifies that querying status for a nonexistent analysis returns 404 with structured JSON."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get(
            "/api/v1/analyses/00000000-0000-0000-0000-000000000000/status",
            headers={"X-Guest-Session": "true"},
        )
    assert resp.status_code == 404
    data = resp.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_api_nonexistent_report_returns_404():
    """Verifies that querying a report for a nonexistent analysis returns 404 with structured JSON."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get(
            "/api/v1/reports/00000000-0000-0000-0000-000000000000",
            headers={"X-Guest-Session": "true"},
        )
    assert resp.status_code == 404
    data = resp.json()
    assert "detail" in data
