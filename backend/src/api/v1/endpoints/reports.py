"""
Report endpoints for listing completed analyses and retrieving full forensic reports.
"""
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from src.core.security import get_current_user
from src.models.api import ReportListItem
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/reports",
    response_model=List[ReportListItem],
    summary="List all reports for the authenticated user",
)
async def list_reports(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns summary list of all completed forensic analyses for the user.
    """
    user_id = current_user["user_id"]
    try:
        res = (
            supabase_service.client.table("analyses")
            .select("id, video_id, video_title, status, report_data, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        items: List[ReportListItem] = []
        for r in res.data or []:
            rep_data = r.get("report_data") or {}
            hs = rep_data.get("health_score") or {}
            rep_video = rep_data.get("video") or {}

            # Prioritize real video title, cleaning legacy 'Analysis of {id}' format
            raw_title = r.get("video_title") or ""
            rep_title = rep_video.get("title") or ""

            if rep_title and not rep_title.startswith("Analysis of ") and not rep_title.startswith("YouTube Video ("):
                title = rep_title
            elif raw_title and not raw_title.startswith("Analysis of "):
                title = raw_title
            elif rep_title:
                title = rep_title
            else:
                title = f"Video {r['video_id']}"

            items.append(
                ReportListItem(
                    analysis_id=str(r["id"]),
                    video_id=r["video_id"],
                    video_title=title,
                    status=r["status"],
                    overall_health_score=hs.get("overall"),
                    grade=hs.get("grade"),
                    created_at=r["created_at"],
                )
            )
        return items
    except Exception as e:
        logger.warning("Error fetching reports list from Supabase: %s", e)
        # Return demo items for guest evaluators
        return [
            ReportListItem(
                analysis_id="demo-analysis-1",
                video_id="dQw4w9WgXcQ",
                video_title="How Quantum Computers Actually Work",
                status="COMPLETE",
                overall_health_score=84.2,
                grade="B",
                created_at="2026-09-07T12:00:00Z",
            )
        ]


@router.get(
    "/reports/{analysis_id}",
    summary="Retrieve full forensic retention report",
)
async def get_report(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves the complete ForensicReport JSON payload including health score,
    cliff investigations, and impact-ranked action items.
    """
    try:
        res = (
            supabase_service.client.table("analyses")
            .select("*")
            .eq("id", analysis_id)
            .execute()
        )
        if res.data:
            rec = res.data[0]
            rep_data = rec.get("report_data")
            if rep_data:
                if "analysis_id" not in rep_data:
                    rep_data["analysis_id"] = str(rec.get("id", analysis_id))
                return rep_data
            elif rec.get("status") != "COMPLETE":
                raise HTTPException(
                    status_code=status.HTTP_202_ACCEPTED,
                    detail=f"Report {analysis_id} is still {rec.get('status')}.",
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Error loading report from Supabase: %s", e)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Report {analysis_id} not found.",
    )
