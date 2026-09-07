"""
Comprehensive integration test suite for Cutpoint's 8-agent forensic architecture.
Validates individual agent reasoning, tool execution, adversarial debate loops,
health score breakdown calculations, and conversational memory.
"""
import pytest

from src.agents.archivist import archivist_agent
from src.agents.executive_editor import executive_editor_agent
from src.agents.mathematician import mathematician_agent
from src.agents.skeptic import skeptic_agent
from src.agents.sound_engineer import sound_engineer_agent
from src.agents.studio_advisor import studio_advisor_agent
from src.agents.supervisor import supervisor_agent
from src.agents.visual_detective import visual_detective_agent
from src.models.domain import (
    CliffAnalysis,
    CliffPoint,
    CliffSeverity,
    DetectionResult,
    Evidence,
    RetentionData,
    RetentionDataPoint,
    VideoMetadata,
)
from src.models.state import AnalysisState, AnalysisStatus


@pytest.fixture(autouse=True)
def mock_fast_engines(monkeypatch):
    """Bypasses slow external API network calls in unit tests, triggering fast deterministic heuristic engines."""
    monkeypatch.setattr("src.agents.visual_detective.settings.GEMINI_API_KEY", "")
    monkeypatch.setattr("src.agents.visual_detective.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.sound_engineer.settings.GEMINI_API_KEY", "")
    monkeypatch.setattr("src.agents.sound_engineer.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.supervisor.settings.GEMINI_API_KEY", "")
    monkeypatch.setattr("src.agents.supervisor.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.skeptic.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.executive_editor.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.studio_advisor.settings.GROQ_API_KEY", "")


@pytest.fixture
def sample_video_metadata():
    return VideoMetadata(
        video_id="M576WGiDBdQ",
        title="Why 99% of YouTube Hooks Fail in the First 15 Seconds",
        channel_id="UC_test_channel",
        channel_name="Veritasium Science",
        duration_seconds=600,
        view_count=150000,
        like_count=8500,
        comment_count=420,
    )


@pytest.fixture
def sample_retention_data():
    """Generates synthetic curve with 2 deliberate drops: at 15s (-14%) and at 180s (-9%)."""
    points = []
    duration = 600.0
    for s in range(601):
        if s < 15:
            val = 1.0 - (s * 0.004)
        elif s < 25:
            val = 0.94 - ((s - 15) * 0.014)  # Severe drop ~14%
        elif s < 180:
            val = 0.80 - ((s - 25) * 0.0005)
        elif s < 190:
            val = 0.7225 - ((s - 180) * 0.009)  # Moderate drop ~9%
        else:
            val = max(0.35, 0.6325 - ((s - 190) * 0.0006))
        points.append(
            RetentionDataPoint(
                time_ratio=round(s / duration, 4),
                watch_ratio=round(val, 4),
                timestamp_seconds=float(s),
            )
        )

    return RetentionData(
        video_id="M576WGiDBdQ",
        data_points=points,
        total_duration_seconds=duration,
        quality_score=0.96,
    )


@pytest.fixture
def sample_cliff():
    return CliffPoint(
        timestamp_start=15.0,
        timestamp_end=25.0,
        retention_before=94.0,
        retention_after=80.0,
        drop_percentage=14.0,
        severity=CliffSeverity.CRITICAL,
        position_in_video="early",
        detection_methods=["smoothed_gradient", "sliding_window"],
        detection_confidence=0.92,
        window_start=10.0,
        window_end=30.0,
    )


# ---------------------------------------------------------------------------
# 1. Agent 2: Archivist (Data Ingestion & Fallback)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_archivist_ingestion_fallback():
    """Tests that Archivist generates a clean, valid retention curve even if YouTube API is offline."""
    res = await archivist_agent.ingest(video_id="dQw4w9WgXcQ", user_id="92a1dfd0-fca3-4c54-b5ed-84cf9fb0cc72")
    assert res.metadata is not None
    assert res.metadata.video_id == "dQw4w9WgXcQ"
    assert res.retention is not None
    assert len(res.retention.data_points) >= 100
    assert res.retention.data_points[0].watch_ratio >= 0.90
    assert res.retention.quality_score >= 0.8


# ---------------------------------------------------------------------------
# 2. Agent 3: Mathematician (Ensemble Cliff Detection)
# ---------------------------------------------------------------------------
def test_mathematician_ensemble_detection(sample_retention_data):
    """Tests multi-algorithm cliff detection, severity classification, and confidence scoring."""
    result = mathematician_agent.detect_cliffs(sample_retention_data)
    assert isinstance(result, DetectionResult)
    assert len(result.cliffs) >= 1

    # First cliff should be near 15s with CRITICAL or HIGH severity
    first_cliff = result.cliffs[0]
    assert 10.0 <= first_cliff.timestamp_start <= 25.0
    assert first_cliff.drop_percentage >= 8.0
    assert first_cliff.severity in (CliffSeverity.CRITICAL, CliffSeverity.HIGH)
    assert len(first_cliff.detection_methods) >= 1
    assert 0.0 <= first_cliff.detection_confidence <= 1.0


# ---------------------------------------------------------------------------
# 3. Agent 4: Visual Detective (Tools & Hypotheses)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_visual_detective_tools_and_evidence(sample_cliff, sample_video_metadata, sample_retention_data):
    """Tests empirical tool generation and multimodal evidence gathering."""
    analysis = await visual_detective_agent.investigate_cliff(
        cliff=sample_cliff,
        metadata=sample_video_metadata,
        retention_context=sample_retention_data.data_points,
    )
    assert isinstance(analysis, CliffAnalysis)
    assert analysis.cliff.timestamp_start == sample_cliff.timestamp_start
    assert len(analysis.evidence_chain) >= 2
    assert analysis.confidence_score >= 0.70
    assert len(analysis.recommendations) >= 1
    assert "visual" in analysis.visual_analysis.lower() or len(analysis.visual_analysis) > 10

    # Verify evidence data structures
    for ev in analysis.evidence_chain:
        assert isinstance(ev, Evidence)
        VALID_VISUAL_TOOLS = (
            "inspect_keyframes",
            "measure_visual_stagnancy",
            "analyze_transitions",
            "check_cut_frequency",
            "detect_text_overlays",
            "analyze_speaker_framing",
        )
        assert ev.tool_name in VALID_VISUAL_TOOLS
        assert isinstance(ev.data_reference, dict)


# ---------------------------------------------------------------------------
# 4. Agent 5: Sound Engineer (Acoustic Tools & Cadence)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_sound_engineer_tools_and_evidence(sample_cliff, sample_video_metadata, sample_retention_data):
    """Tests acoustic metrics, dead air detection, volume analysis, and evidence gathering."""
    analysis = await sound_engineer_agent.investigate_cliff(
        cliff=sample_cliff,
        metadata=sample_video_metadata,
        retention_context=sample_retention_data.data_points,
    )
    assert isinstance(analysis, CliffAnalysis)
    assert len(analysis.evidence_chain) >= 2
    assert analysis.confidence_score >= 0.70
    assert len(analysis.recommendations) >= 1

    VALID_AUDIO_TOOLS = (
        "analyze_speech_cadence",
        "detect_dead_air",
        "measure_energy_envelope",
        "detect_audio_artifacts",
        "extract_transcript_sentiment",
    )
    for ev in analysis.evidence_chain:
        assert isinstance(ev, Evidence)
        assert ev.tool_name in VALID_AUDIO_TOOLS


# ---------------------------------------------------------------------------
# 5. Agent 6: Skeptic (Adversarial Debate & Verification Loop)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_skeptic_adversarial_critique(sample_cliff, sample_video_metadata, sample_retention_data):
    """Tests that the Critic cross-examines findings, issues counter-hypotheses, and calibrates confidence."""
    visual_finding = await visual_detective_agent.investigate_cliff(
        cliff=sample_cliff,
        metadata=sample_video_metadata,
        retention_context=sample_retention_data.data_points,
    )
    audio_finding = await sound_engineer_agent.investigate_cliff(
        cliff=sample_cliff,
        metadata=sample_video_metadata,
        retention_context=sample_retention_data.data_points,
    )

    verdict = await skeptic_agent.review_finding(
        cliff=sample_cliff,
        visual_finding=visual_finding,
        audio_finding=audio_finding,
        debate_round=1,
    )

    assert "action" in verdict
    assert verdict["action"] in ("APPROVE", "CHALLENGE")
    assert "counter_hypotheses" in verdict
    assert len(verdict["counter_hypotheses"]) >= 1
    assert "calibrated_confidence" in verdict
    assert 0.0 <= float(verdict["calibrated_confidence"]) <= 1.0
    assert "unified_root_cause" in verdict
    assert len(verdict["unified_root_cause"]) > 5


# ---------------------------------------------------------------------------
# 6. Agent 1: Supervisor (Investigation Plan & Coordination)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_supervisor_investigation_orchestration(sample_video_metadata, sample_retention_data):
    """Tests supervisor formulating plan, dispatching concurrent specialists, and assembling verified analyses."""
    detection = mathematician_agent.detect_cliffs(sample_retention_data)
    state = AnalysisState(
        analysis_id="test_supervisor_run",
        video_id=sample_video_metadata.video_id,
        status=AnalysisStatus.INVESTIGATING,
        current_phase="Testing supervisor",
    )

    verified = await supervisor_agent.run_investigation(
        detection_result=detection,
        metadata=sample_video_metadata,
        retention_data=sample_retention_data,
        state=state,
    )

    assert len(verified) == len(detection.cliffs)
    for v in verified:
        assert v.critic_approved is True
        assert v.confidence_score >= 0.70
        # Verified analysis should include adversarial audit in evidence chain
        tools = [e.tool_name for e in v.evidence_chain]
        assert "adversarial_audit" in tools
        assert len(v.recommendations) >= 1


# ---------------------------------------------------------------------------
# 7. Agent 7: Executive Editor (Health Score & Report Synthesis)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_executive_editor_report_synthesis(sample_video_metadata, sample_retention_data):
    """Tests 5-pillar health score computation, letter grades, and impact-ranked action items."""
    detection = mathematician_agent.detect_cliffs(sample_retention_data)
    state = AnalysisState(analysis_id="test_editor_run", video_id=sample_video_metadata.video_id)
    verified = await supervisor_agent.run_investigation(
        detection_result=detection,
        metadata=sample_video_metadata,
        retention_data=sample_retention_data,
        state=state,
    )

    report = await executive_editor_agent.synthesize_report(
        metadata=sample_video_metadata,
        verified_findings=verified,
        cliffs=detection.cliffs,
        analysis_id="test_editor_run",
    )

    assert report.analysis_id == "test_editor_run"
    assert report.video.video_id == sample_video_metadata.video_id
    assert 0.0 <= report.health_score.overall <= 100.0
    assert report.health_score.grade in ("A+", "A", "B", "C", "D", "F")
    # Check 5 pillars
    assert 0.0 <= report.health_score.hook_score <= 100.0
    assert 0.0 <= report.health_score.pacing_score <= 100.0
    assert 0.0 <= report.health_score.audio_score <= 100.0
    assert 0.0 <= report.health_score.visual_score <= 100.0
    assert 0.0 <= report.health_score.content_score <= 100.0

    # Check action items
    assert len(report.action_items) >= 1
    for item in report.action_items:
        assert item.priority in ("P0", "P1", "P2", "HIGH", "MEDIUM", "LOW")
        assert len(item.description) > 5


# ---------------------------------------------------------------------------
# 8. Agent 8: Studio Advisor (Interactive Tool Calling & Conversational Fallback)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_studio_advisor_grounded_conversation(sample_video_metadata, sample_retention_data):
    """Tests that Agent 8 answers questions grounded in the report and cites tools properly."""
    detection = mathematician_agent.detect_cliffs(sample_retention_data)
    state = AnalysisState(analysis_id="test_advisor_run", video_id=sample_video_metadata.video_id)
    verified = await supervisor_agent.run_investigation(detection, sample_video_metadata, sample_retention_data, state)
    report = await executive_editor_agent.synthesize_report(sample_video_metadata, verified, detection.cliffs, "test_advisor_run")

    # Test query about health score
    tokens = []
    async for tok in studio_advisor_agent.chat(
        message="What is my overall retention score and where did I lose viewers?",
        conversation_history=[],
        report=report,
        retention_data=sample_retention_data,
    ):
        tokens.append(tok)

    response = "".join(tokens)
    assert len(response) > 50
    # Should reference score or cliffs
    assert str(int(report.health_score.overall)) in response or "score" in response.lower() or "retention" in response.lower()

    # Test query about action items
    action_tokens = []
    async for tok in studio_advisor_agent.chat(
        message="What are the highest priority editing fixes I should make?",
        conversation_history=[{"role": "user", "content": "hello"}, {"role": "assistant", "content": "Hi"}],
        report=report,
        retention_data=sample_retention_data,
    ):
        action_tokens.append(tok)

    action_response = "".join(action_tokens)
    assert len(action_response) > 40
