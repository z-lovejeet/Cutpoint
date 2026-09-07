"""
Chat endpoints for interactive follow-up Q&A with Agent 8 (The Studio Advisor).
Implements token streaming via Server-Sent Events (SSE).
"""
import json
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from src.agents.studio_advisor import studio_advisor_agent
from src.core.security import get_current_user
from src.models.api import ChatMessageResponse, ChatRequest
from src.models.domain import ForensicReport
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/chat",
    summary="Interactive follow-up conversation with Agent 8 (SSE Streaming)",
)
async def chat_with_strategist(
    req: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Streams conversational analysis and strategic advice token-by-token
    using Server-Sent Events (SSE) grounded in the ForensicReport.
    """
    analysis_id = req.analysis_id
    user_id = current_user["user_id"]
    user_message = req.message.strip()

    # 1. Fetch the completed forensic report
    report_dict = None
    try:
        res = (
            supabase_service.client.table("analyses")
            .select("report_data")
            .eq("id", analysis_id)
            .execute()
        )
        if res.data:
            report_dict = res.data[0].get("report_data")
    except Exception as e:
        logger.warning("Error reading report for chat: %s", e)

    if not report_dict:
        # Generate demo report context if not yet persisted
        from src.models.domain import HealthScore, VideoMetadata
        report = ForensicReport(
            report_id=analysis_id,
            video=VideoMetadata(
                video_id="demo_vid",
                title="Retention Audit Demo",
                channel_id="demo_ch",
                duration_seconds=720,
            ),
            health_score=HealthScore(
                overall=82.0,
                grade="B",
                content_score=85.0,
                pacing_score=78.0,
                audio_score=80.0,
                visual_score=84.0,
                hook_score=81.0,
            ),
            executive_summary="Demo report context for interactive evaluator chat.",
        )
    else:
        try:
            report = ForensicReport.model_validate(report_dict)
        except Exception:
            report = ForensicReport(
                report_id=analysis_id,
                video=VideoMetadata(video_id="vid", title="Video Audit", channel_id="ch", duration_seconds=600),
                health_score=HealthScore(overall=80.0, grade="B"),
                executive_summary="Retention report loaded.",
            )

    # 2. Fetch recent conversation history
    history: List[Dict[str, str]] = []
    try:
        h_res = (
            supabase_service.client.table("chat_messages")
            .select("role, content")
            .eq("analysis_id", analysis_id)
            .order("created_at", desc=False)
            .limit(10)
            .execute()
        )
        if h_res.data:
            history = [{"role": r["role"], "content": r["content"]} for r in h_res.data]
    except Exception as e:
        logger.warning("Error fetching chat history from DB: %s", e)

    # 3. Persist user message to Supabase
    try:
        supabase_service.client.table("chat_messages").insert({
            "analysis_id": analysis_id,
            "user_id": user_id,
            "role": "user",
            "content": user_message,
        }).execute()
    except Exception as e:
        logger.warning("Could not persist user chat message to Supabase: %s", e)

    # 4. Stream response generator
    async def sse_event_generator():
        collected_tokens: List[str] = []
        try:
            async for token in studio_advisor_agent.chat(
                message=user_message,
                conversation_history=history,
                report=report,
            ):
                collected_tokens.append(token)
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"

            yield "data: [DONE]\n\n"

            # Persist assistant reply to Supabase
            full_reply = "".join(collected_tokens)
            if full_reply and user_id:
                try:
                    supabase_service.client.table("chat_messages").insert({
                        "analysis_id": analysis_id,
                        "user_id": user_id,
                        "role": "assistant",
                        "content": full_reply,
                    }).execute()
                except Exception as e:
                    logger.warning("Could not persist assistant chat reply: %s", e)
        except Exception as e:
            logger.error("Error in SSE chat stream: %s", e)
            err_data = json.dumps({"error": str(e)})
            yield f"data: {err_data}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/chat/{analysis_id}/history",
    response_model=List[ChatMessageResponse],
    summary="Get chat history for an analysis report",
)
async def get_chat_history(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves stored chat conversation messages between creator and Agent 8.
    """
    try:
        res = (
            supabase_service.client.table("chat_messages")
            .select("role, content, created_at")
            .eq("analysis_id", analysis_id)
            .order("created_at", desc=False)
            .execute()
        )
        return [
            ChatMessageResponse(
                role=r["role"],
                content=r["content"],
                created_at=r["created_at"],
            )
            for r in (res.data or [])
        ]
    except Exception as e:
        logger.warning("Error fetching chat messages: %s", e)
        return []
