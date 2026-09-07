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


