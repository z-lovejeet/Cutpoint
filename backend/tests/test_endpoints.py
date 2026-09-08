import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.services.supabase_service import supabase_service


@pytest.mark.asyncio
async def test_subsystem_status_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["api_version"] == "v1"
    assert data["system"] == "operational"
    assert data["agents"]["supervisor"] == "active"
    assert data["agents"]["visual_detective"] == "active"


@pytest.mark.asyncio
async def test_start_analysis_endpoint():
    analysis_id = None
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post(
                "/api/v1/analyze",
                json={"video_id": "dQw4w9WgXcQ"},
                headers={"X-Guest-Session": "true"},
            )
        assert resp.status_code == 202
        data = resp.json()
        assert "analysis_id" in data
        analysis_id = data["analysis_id"]
        assert data["status"] == "PENDING"
    finally:
        if analysis_id:
            try:
                supabase_service.client.table("analyses").delete().eq("id", analysis_id).execute()
            except Exception:
                pass


@pytest.mark.asyncio
async def test_analysis_status_polling():
    analysis_id = None
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # Start analysis
            init_resp = await ac.post(
                "/api/v1/analyze",
                json={"video_id": "M576WGiDBdQ"},
                headers={"X-Guest-Session": "true"},
            )
            analysis_id = init_resp.json()["analysis_id"]

            # Poll status
            status_resp = await ac.get(
                f"/api/v1/analyses/{analysis_id}/status",
                headers={"X-Guest-Session": "true"},
            )
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["analysis_id"] == analysis_id
        assert status_data["status"] in ("PENDING", "FETCHING_DATA", "DETECTING_CLIFFS", "INVESTIGATING", "GENERATING_REPORT", "COMPLETE")
    finally:
        if analysis_id:
            try:
                supabase_service.client.table("analyses").delete().eq("id", analysis_id).execute()
            except Exception:
                pass


@pytest.mark.asyncio
async def test_list_reports_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/reports", headers={"X-Guest-Session": "true"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_videos_list_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/videos", headers={"X-Guest-Session": "true"})
    assert resp.status_code == 200
    videos = resp.json()
    assert len(videos) >= 1
    assert "video_id" in videos[0]
    assert "title" in videos[0]


@pytest.mark.asyncio
async def test_youtube_auth_redirect_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/auth/youtube", follow_redirects=False)
    assert resp.status_code == 307
    assert "accounts.google.com" in resp.headers.get("location", "") or "demo_connected" in resp.headers.get("location", "")


@pytest.mark.asyncio
async def test_youtube_auth_post_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/auth/youtube", headers={"X-Guest-Session": "true"})
    assert resp.status_code == 200
    data = resp.json()
    assert "auth_url" in data


@pytest.mark.asyncio
async def test_youtube_disconnect_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete("/api/v1/auth/youtube", headers={"X-Guest-Session": "true"})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    assert "disconnected" in data.get("message", "").lower()


@pytest.mark.asyncio
async def test_videos_disconnected_guest():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get(
            "/api/v1/videos",
            headers={"X-Guest-Session": "true", "X-Guest-Channel-Disconnected": "true"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data == []


@pytest.mark.asyncio
async def test_rewrite_script_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test Hook Rewrite
        resp_hook = await ac.post(
            "/api/v1/reports/demo-analysis-1/rewrite",
            json={"mode": "hook", "style": "curiosity"},
            headers={"X-Guest-Session": "true"},
        )
        assert resp_hook.status_code == 200
        data_hook = resp_hook.json()
        assert data_hook["mode"] == "hook"
        assert "rewritten_script" in data_hook
        assert len(data_hook["director_notes"]) > 0

        # Test Cliff Rewrite
        resp_cliff = await ac.post(
            "/api/v1/reports/demo-analysis-1/rewrite",
            json={"mode": "cliff", "cliff_index": 0},
            headers={"X-Guest-Session": "true"},
        )
        assert resp_cliff.status_code == 200
        data_cliff = resp_cliff.json()
        assert data_cliff["mode"] == "cliff"
        assert "rewritten_script" in data_cliff

        # Test Whole Script Rewrite
        resp_whole = await ac.post(
            "/api/v1/reports/demo-analysis-1/rewrite",
            json={"mode": "whole_script"},
            headers={"X-Guest-Session": "true"},
        )
        assert resp_whole.status_code == 200
        data_whole = resp_whole.json()
        assert data_whole["mode"] == "whole_script"
        assert "5-ACT" in data_whole["rewritten_script"]


@pytest.mark.asyncio
async def test_export_timeline_markers_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # DaVinci CSV
        resp_csv = await ac.get(
            "/api/v1/reports/demo-analysis-1/export/davinci_csv",
            headers={"X-Guest-Session": "true"},
        )
        assert resp_csv.status_code == 200
        assert "Record In,Record Out" in resp_csv.text

        # EDL
        resp_edl = await ac.get(
            "/api/v1/reports/demo-analysis-1/export/edl",
            headers={"X-Guest-Session": "true"},
        )
        assert resp_edl.status_code == 200
        assert "TITLE: Cutpoint Retention Markers" in resp_edl.text

        # YouTube Chapters
        resp_yt = await ac.get(
            "/api/v1/reports/demo-analysis-1/export/youtube_chapters",
            headers={"X-Guest-Session": "true"},
        )
        assert resp_yt.status_code == 200
        assert "00:00 - Introduction & Hook" in resp_yt.text


@pytest.mark.asyncio
async def test_delete_report_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(
            "/api/v1/reports/test-to-delete-123",
            headers={"X-Guest-Session": "true"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["analysis_id"] == "test-to-delete-123"




