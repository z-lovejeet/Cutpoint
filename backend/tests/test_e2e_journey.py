"""
End-to-End user journey validation and 10-consecutive-run reliability harness for Cutpoint.
Tests the full lifecycle:
Auth -> Start Analysis -> Status Stepper Polling -> Report Fetching -> Studio Advisor Chat.
Verifies Phase 10 Testing Criteria: '10 consecutive E2E tests pass without manual intervention'.
"""
import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.services.supabase_service import supabase_service


@pytest.fixture(autouse=True)
def mock_gemini_fast_mode(monkeypatch):
    """Bypasses Gemini & Groq external network delays so E2E test runs execute rapidly and deterministically."""
    monkeypatch.setattr("src.agents.visual_detective.settings.GEMINI_API_KEY", "")
    monkeypatch.setattr("src.agents.visual_detective.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.sound_engineer.settings.GEMINI_API_KEY", "")
    monkeypatch.setattr("src.agents.sound_engineer.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.supervisor.settings.GEMINI_API_KEY", "")
    monkeypatch.setattr("src.agents.supervisor.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.skeptic.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.executive_editor.settings.GROQ_API_KEY", "")
    monkeypatch.setattr("src.agents.studio_advisor.settings.GROQ_API_KEY", "")


async def execute_full_journey(client: AsyncClient, run_index: int) -> dict:
    """Helper executing one complete end-to-end user forensic journey."""
    video_id = "M576WGiDBdQ"
    analysis_id = None

    try:
        # 1. Queue Analysis
        init_resp = await client.post(
            "/api/v1/analyze",
            json={"video_id": f"https://www.youtube.com/watch?v={video_id}"},
            headers={"X-Guest-Session": "true"},
        )
        assert init_resp.status_code == 202, f"Run {run_index}: Failed to queue analysis ({init_resp.status_code})"
        init_data = init_resp.json()
        analysis_id = init_data["analysis_id"]
        assert init_data["status"] == "PENDING"

        # 2. Poll Status Stepper until complete (max 10 seconds)
        max_polls = 100
        status_data = None
        for _ in range(max_polls):
            await asyncio.sleep(0.1)
            poll_resp = await client.get(
                f"/api/v1/analyses/{analysis_id}/status",
                headers={"X-Guest-Session": "true"},
            )
            assert poll_resp.status_code == 200, f"Run {run_index}: Polling failed ({poll_resp.status_code})"
            status_data = poll_resp.json()
            if status_data["status"] in ("COMPLETE", "ERROR"):
                break

        assert status_data is not None, f"Run {run_index}: No status returned"
        assert status_data["status"] == "COMPLETE", f"Run {run_index}: Analysis failed with {status_data.get('error_message')}"
        assert status_data["progress_percentage"] == 100

        # 3. Retrieve Final Forensic Report
        report_resp = await client.get(
            f"/api/v1/reports/{analysis_id}",
            headers={"X-Guest-Session": "true"},
        )
        assert report_resp.status_code == 200, f"Run {run_index}: Failed to fetch report"
        report_data = report_resp.json()

        assert report_data.get("report_id") == analysis_id or report_data.get("analysis_id") == analysis_id
        assert "health_score" in report_data
        assert 0.0 <= report_data["health_score"]["overall"] <= 100.0
        assert report_data["health_score"]["grade"] in ("A+", "A", "B", "C", "D", "F")
        assert len(report_data["cliff_reports"]) >= 1
        assert len(report_data["action_items"]) >= 1

        # 4. Chat with Studio Advisor grounded in report
        chat_resp = await client.post(
            "/api/v1/chat",
            json={
                "analysis_id": analysis_id,
                "message": "Why did retention drop at the first cliff and how do I fix it?",
            },
            headers={"X-Guest-Session": "true"},
        )
        assert chat_resp.status_code == 200, f"Run {run_index}: Chat endpoint failed"
        assert len(chat_resp.text) > 20

        return {
            "run_index": run_index,
            "analysis_id": analysis_id,
            "health_score": report_data["health_score"]["overall"],
            "grade": report_data["health_score"]["grade"],
            "cliffs_found": len(report_data["cliff_reports"]),
            "action_items": len(report_data["action_items"]),
        }

    finally:
        # 5. Clean up test record from Supabase table
        if analysis_id:
            try:
                supabase_service.client.table("analyses").delete().eq("id", analysis_id).execute()
            except Exception:
                pass


@pytest.mark.asyncio
async def test_single_complete_user_journey():
    """Executes a single end-to-end user forensic journey."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        summary = await execute_full_journey(client, run_index=1)
        assert summary["health_score"] > 0
        assert summary["cliffs_found"] >= 1


@pytest.mark.asyncio
async def test_10_consecutive_e2e_runs():
    """
    Validates Phase 10 Testing Criteria:
    Executes 10 consecutive complete end-to-end runs without manual intervention.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        results = []
        for i in range(1, 11):
            summary = await execute_full_journey(client, run_index=i)
            results.append(summary)

        assert len(results) == 10
        for r in results:
            assert r["health_score"] > 0
            assert r["cliffs_found"] >= 1
            assert r["action_items"] >= 1
