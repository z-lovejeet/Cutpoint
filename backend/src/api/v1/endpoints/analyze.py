"""
Analysis endpoints for starting and polling video retention forensic runs.
"""
import asyncio
import logging
import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from src.agents.orchestrator import pipeline_orchestrator
from src.core.security import get_current_user
from src.models.api import AnalysisRequest, AnalysisResponse, AnalysisStatusResponse
from src.services.supabase_service import supabase_service
from src.services.youtube_service import youtube_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue a video retention forensic analysis",
)
async def start_analysis(
    req: AnalysisRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Initiates the 8-agent retention forensic analysis pipeline for a YouTube video.
    Returns 202 Accepted with a unique analysis_id for progress polling.
    """
    video_id = req.video_id.strip()
    user_id = current_user["user_id"]
    analysis_id = str(uuid.uuid4())

    logger.info("Queuing analysis %s for video %s (user: %s)...", analysis_id, video_id, user_id)

    # Fetch real video title via quick oEmbed lookup
    video_title = f"Video {video_id}"
    try:
        oembed = await youtube_service.fetch_video_oembed(video_id)
        if oembed and oembed.get("title"):
            video_title = oembed["title"]
    except Exception:
        pass

    # Persist pending record in database
    try:
        supabase_service.create_analysis_record(
            user_id=user_id,
            video_id=video_id,
            video_title=video_title,
            analysis_id=analysis_id,
        )
    except Exception as e:
        logger.warning("Could not persist initial analysis record to Supabase: %s", e)

    # Register state immediately for synchronous polling readiness
    pipeline_orchestrator.initialize_state(analysis_id, video_id)

    # Launch pipeline as background task
    asyncio.create_task(
        pipeline_orchestrator.run_analysis(
            analysis_id=analysis_id,
            video_id=video_id,
            user_id=user_id,
        )
    )

    return AnalysisResponse(
        analysis_id=analysis_id,
        status="PENDING",
        message="Video analysis pipeline initialized and queued.",
    )


@router.get(
    "/analyses/{analysis_id}/status",
    response_model=AnalysisStatusResponse,
    summary="Get real-time stepper progress of an analysis run",
)
async def get_analysis_status(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns live step-by-step progress, active agent names, and debate round metrics.
    """
    # 1. Check live in-memory state first
    live_state = pipeline_orchestrator.get_state(analysis_id)
    if live_state:
        telemetry: Dict[str, Any] = {
            "video_id": live_state.video_id,
            "total_messages": len(live_state.agent_messages),
            "debate_rounds": live_state.debate_rounds,
        }
        for msg in live_state.agent_messages:
            if msg.sender == "The Archivist" and msg.data:
                telemetry["video_title"] = msg.data.get("title")
                telemetry["duration_seconds"] = msg.data.get("duration_seconds")
                telemetry["retention_points"] = msg.data.get("data_points")
                telemetry["average_retention"] = msg.data.get("average_retention")
            elif msg.sender == "The Mathematician" and msg.data:
                telemetry["cliffs_count"] = msg.data.get("cliffs_count")
                telemetry["cliffs"] = msg.data.get("cliffs")
            elif msg.sender == "The Executive Editor" and msg.data:
                telemetry["overall_score"] = msg.data.get("overall_score")
                telemetry["grade"] = msg.data.get("grade")
                telemetry["action_items_count"] = msg.data.get("action_items_count")

        if live_state.investigation_plan:
            telemetry["total_cliffs"] = live_state.investigation_plan.total_cliffs
            telemetry["strategy"] = live_state.investigation_plan.strategy
            telemetry["priority_order"] = live_state.investigation_plan.priority_order
            telemetry["plan_rationale"] = live_state.investigation_plan.rationale

        return AnalysisStatusResponse(
            analysis_id=analysis_id,
            status=live_state.status.value,
            progress_percentage=live_state.progress_percentage,
            current_phase=live_state.current_phase,
            active_agents=live_state.active_agents,
            debate_rounds=live_state.debate_rounds,
            error_message=live_state.error_message,
            agent_messages=[m.model_dump() for m in live_state.agent_messages[-30:]],
            investigation_plan=live_state.investigation_plan.model_dump() if live_state.investigation_plan else None,
            telemetry=telemetry,
        )

    # 2. Check Supabase database record
    try:
        res = (
            supabase_service.client.table("analyses")
            .select("status, error_message, report_data")
            .eq("id", analysis_id)
            .execute()
        )
        if res.data:
            rec = res.data[0]
            st = rec.get("status", "PENDING")
            rep_data = rec.get("report_data") or {}
            hs = rep_data.get("health_score") or {}
            telemetry = {}
            if rep_data:
                telemetry["overall_score"] = hs.get("overall")
                telemetry["grade"] = hs.get("grade")
                telemetry["cliffs_count"] = len(rep_data.get("cliff_reports") or [])
                telemetry["action_items_count"] = len(rep_data.get("action_items") or [])

            return AnalysisStatusResponse(
                analysis_id=analysis_id,
                status=st,
                progress_percentage=100 if st == "COMPLETE" else 50,
                current_phase="Analysis complete. Forensic report ready." if st == "COMPLETE" else "Processing in background...",
                active_agents=[],
                debate_rounds=1 if st == "COMPLETE" else 0,
                error_message=rec.get("error_message"),
                agent_messages=[],
                investigation_plan=None,
                telemetry=telemetry,
            )
    except Exception as e:
        logger.warning("Failed querying status from Supabase: %s", e)

    # If state not found, return 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Analysis {analysis_id} not found.",
    )
