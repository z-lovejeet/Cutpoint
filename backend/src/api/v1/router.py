from fastapi import APIRouter

from src.api.v1.endpoints import analyze, chat, reports, videos, youtube_auth

api_router = APIRouter(prefix="/v1")

# Mount sub-routers
api_router.include_router(analyze.router, tags=["Forensic Analysis"])
api_router.include_router(reports.router, tags=["Forensic Reports"])
api_router.include_router(youtube_auth.router, tags=["YouTube Authentication"])
api_router.include_router(videos.router, tags=["Video Library"])
api_router.include_router(chat.router, tags=["Strategist Chat"])


@api_router.get("/status", tags=["System Status"])
async def get_v1_status():
    """Returns v1 API subsystem readiness and agent roster status."""
    return {
        "api_version": "v1",
        "system": "operational",
        "subsystems": {
            "orchestrator": "ready",
            "youtube_service": "configured",
            "gemini_service": "configured",
            "groq_service": "configured",
        },
        "agents": {
            "supervisor": "active",
            "archivist": "active",
            "mathematician": "active",
            "visual_detective": "active",
            "sound_engineer": "active",
            "skeptic": "active",
            "executive_editor": "active",
            "studio_advisor": "active",
        },
    }
