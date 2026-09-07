import pytest
from pydantic import ValidationError

from src.models.domain import (
    ActionItem,
    CliffPoint,
    CliffSeverity,
    ForensicReport,
    HealthScore,
    RetentionDataPoint,
    VideoMetadata,
)
from src.models.state import AnalysisState, AnalysisStatus


def test_video_metadata_validation():
    # Valid metadata
    meta = VideoMetadata(
        video_id="test_vid_123",
        title="Test Video Title",
        channel_id="ch_123",
        duration_seconds=300,
        view_count=1000,
    )
    assert meta.video_id == "test_vid_123"
    assert meta.duration_seconds == 300

    # Invalid duration <= 0
    with pytest.raises(ValidationError):
        VideoMetadata(
            video_id="test_vid_123",
            title="Invalid",
            channel_id="ch_123",
            duration_seconds=0,
        )


def test_retention_data_point_bounds():
    # Valid point
    pt = RetentionDataPoint(time_ratio=0.5, watch_ratio=0.8, timestamp_seconds=150.0)
    assert pt.time_ratio == 0.5

    # Invalid time_ratio > 1.0
    with pytest.raises(ValidationError):
        RetentionDataPoint(time_ratio=1.5, watch_ratio=0.8, timestamp_seconds=150.0)


def test_cliff_point_validation():
    # Valid cliff
    cliff = CliffPoint(
        timestamp_start=12.0,
        timestamp_end=15.0,
        drop_percentage=8.5,
        severity=CliffSeverity.HIGH,
        retention_before=0.85,
        retention_after=0.765,
        position_in_video="early",
        detection_confidence=0.9,
    )
    assert cliff.drop_percentage == 8.5
    assert cliff.severity == CliffSeverity.HIGH

    # Invalid drop_percentage < 5.0
    with pytest.raises(ValidationError):
        CliffPoint(
            timestamp_start=12.0,
            timestamp_end=15.0,
            drop_percentage=3.0,
            severity=CliffSeverity.LOW,
            retention_before=0.85,
            retention_after=0.82,
            position_in_video="early",
            detection_confidence=0.9,
        )

    # Invalid position_in_video
    with pytest.raises(ValidationError):
        CliffPoint(
            timestamp_start=12.0,
            timestamp_end=15.0,
            drop_percentage=6.0,
            severity=CliffSeverity.LOW,
            retention_before=0.85,
            retention_after=0.79,
            position_in_video="intro_section",  # not early/middle/late
            detection_confidence=0.9,
        )


def test_forensic_report_serialization():
    meta = VideoMetadata(
        video_id="v1",
        title="Test",
        channel_id="c1",
        duration_seconds=600,
    )
    health = HealthScore(
        overall=88.5,
        grade="B",
        hook_score=90.0,
        pacing_score=85.0,
    )
    report = ForensicReport(
        report_id="rep_test_01",
        video=meta,
        health_score=health,
        executive_summary="Solid retention performance.",
        action_items=[
            ActionItem(
                priority="P0",
                category="HOOK",
                description="Shorten intro by 3 seconds",
            )
        ],
    )
    dumped = report.model_dump()
    assert dumped["report_id"] == "rep_test_01"
    assert dumped["health_score"]["grade"] == "B"

    # Re-hydrate
    reloaded = ForensicReport.model_validate(dumped)
    assert reloaded.report_id == "rep_test_01"
    assert reloaded.video.title == "Test"


def test_analysis_state_enum():
    state = AnalysisState(
        analysis_id="state_01",
        video_id="v_01",
        status=AnalysisStatus.INVESTIGATING,
        progress_percentage=60,
    )
    assert state.status == AnalysisStatus.INVESTIGATING
    assert state.progress_percentage == 60
