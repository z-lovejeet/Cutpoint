from fastapi import APIRouter

api_router = APIRouter(prefix="/v1")


@api_router.get("/status")
async def get_v1_status():
    """Returns v1 API subsystem status."""
    return {
        "api_version": "v1",
        "subsystems": {
            "orchestrator": "ready",
            "youtube_service": "configured",
            "gemini_analyzer": "configured",
            "groq_reporter": "configured",
        },
    }
