"""
Agent 8: Strategist Chat Agent (The Studio Advisor)
Interactive conversational strategist powered by Groq GPT-OSS 120B.
Answers questions grounded in the ForensicReport using dynamic tool calling and streaming.
"""
import asyncio
import logging
from typing import AsyncGenerator, Dict, List, Optional

from src.core.config import settings
from src.models.domain import ForensicReport, RetentionData
from src.services.groq_service import groq_service

logger = logging.getLogger(__name__)

STUDIO_ADVISOR_PROMPT = """You are the Strategist Chat Agent (The Studio Advisor) for Cutpoint.
You are an elite YouTube retention strategist and executive producer.
Your job is to talk directly with the creator/producer about their Forensic Retention Report.

PERSONA:
- Direct, encouraging, high-agency, insightful
- Speak like an experienced video editor and YouTube algorithm specialist
- Ground all answers strictly in the forensic report data, timestamps, and measurements
- For specific timestamp questions, explain the exact root cause and editing prescription
- Format responses in clean GitHub Markdown with clear bullet points where helpful
"""


class StudioAdvisorAgent:
    """The Studio Advisor: Interactive creator Q&A grounded in forensic evidence."""

    def __init__(self):
        self.name = "Strategist Chat Agent (The Studio Advisor)"

    async def chat(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        report: ForensicReport,
        retention_data: Optional[RetentionData] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Processes user chat query against the forensic report and streams tokens back.
        """
        logger.info("[%s] Processing user query: '%s'...", self.name, message[:80])

        report_context = f"""[VIDEO CONTEXT]
Title: {report.video.title} (Duration: {report.video.duration_seconds}s)
Overall Health Score: {report.health_score.overall}/100 (Grade: {report.health_score.grade})
Scores: Hook: {report.health_score.hook_score}, Pacing: {report.health_score.pacing_score}, Audio: {report.health_score.audio_score}, Visual: {report.health_score.visual_score}, Content: {report.health_score.content_score}

[EXECUTIVE SUMMARY]
{report.executive_summary}

## AVAILABLE DATA TOOLS & EVIDENCE
When the user asks about specific timestamps, metrics, or forensic evidence, dynamically cite the corresponding TOOL section:

### TOOL: get_cliff_details
"""
        for i, c in enumerate(report.cliff_reports):
            report_context += (
                f"Cliff #{i+1} at {c.cliff.timestamp_start:.1f}s-{c.cliff.timestamp_end:.1f}s:\n"
                f"  - Drop: -{c.cliff.drop_percentage:.1f}% | Severity: {c.cliff.severity.value} | Retention: {c.cliff.retention_before:.1f}% -> {c.cliff.retention_after:.1f}%\n"
                f"  - Root Cause: {c.root_cause}\n"
                f"  - Visual Analysis: {c.visual_analysis}\n"
                f"  - Audio Analysis: {c.audio_analysis}\n"
                f"  - Pacing Analysis: {c.pacing_analysis}\n"
                f"  - Content Analysis: {c.content_analysis}\n"
                f"  - Confidence: {c.confidence_score} | Critic Approved: {c.critic_approved}\n"
                f"  - Prescriptions: {', '.join(c.recommendations)}\n"
            )

        report_context += "\n### TOOL: get_health_breakdown\n"
        report_context += (
            f"Overall Score: {report.health_score.overall}/100 (Grade {report.health_score.grade})\n"
            f"Pillars: Hook={report.health_score.hook_score}/100, Pacing={report.health_score.pacing_score}/100, "
            f"Audio={report.health_score.audio_score}/100, Visual={report.health_score.visual_score}/100, "
            f"Content={report.health_score.content_score}/100\n"
        )

        report_context += "\n### TOOL: get_action_items\n"
        for i, item in enumerate(report.action_items):
            report_context += f"{i+1}. [{item.priority}] ({item.category}) {item.description} (Impact: {item.expected_impact})\n"

        if report.positive_highlights:
            report_context += "\n### TOOL: get_positive_highlights\n"
            for h in report.positive_highlights:
                if isinstance(h, str):
                    report_context += f"- {h}\n"
                else:
                    t_start = getattr(h, "timestamp_start", 0)
                    t_end = getattr(h, "timestamp_end", 0)
                    peak = getattr(h, "peak_retention", 0.0)
                    desc = getattr(h, "description", "")
                    factor = getattr(h, "retention_factor", "Engagement")
                    report_context += f"- Segment {t_start:.0f}s-{t_end:.0f}s (Peak {peak:.1f}%): {desc} [Factor: {factor}]\n"

        messages = [
            {
                "role": "system",
                "content": f"{STUDIO_ADVISOR_PROMPT}\n\nINSTRUCTION: When answering, reference specific data from the tools above (exact drop %, root causes, pillar scores, or action item priorities) to ensure your analysis is authoritative and forensic.\n\n{report_context}",
            },
        ]
        # Append existing conversation history
        for h in conversation_history[-6:]:
            messages.append({"role": h["role"], "content": h["content"]})
        # Append current user prompt
        messages.append({"role": "user", "content": message})

        if settings.GROQ_API_KEY:
            try:
                stream = groq_service.chat_completion_stream(
                    messages=messages,
                    model=settings.GROQ_CHAT_MODEL,
                    temperature=0.3,
                    max_tokens=1500,
                )
                async for token in stream:
                    yield token
                return
            except Exception as e:
                logger.warning("[%s] Groq streaming failed (%s). Using fallback response.", self.name, e)

        # Fallback offline conversational response
        fallback_reply = self._generate_fallback_response(message, report)
        for chunk in fallback_reply.split(" "):
            yield chunk + " "
            await asyncio.sleep(0.02)

    def _generate_fallback_response(self, query: str, report: ForensicReport) -> str:
        """Heuristic advisor response when external LLMs are unavailable."""
        q_lower = query.lower()

        if "score" in q_lower or "grade" in q_lower or "overall" in q_lower:
            return (
                f"Your video earned an overall **Retention Health Score of {report.health_score.overall}/100 "
                f"(Grade {report.health_score.grade})**.\n\n"
                f"- **Hook Score:** {report.health_score.hook_score}/100\n"
                f"- **Pacing Score:** {report.health_score.pacing_score}/100\n"
                f"- **Audio Score:** {report.health_score.audio_score}/100\n\n"
                f"The largest lever for immediate recovery is addressing the **{len(report.cliff_reports)} detected cliff drops**, "
                f"especially in the first 60 seconds."
            )

        if "cliff" in q_lower or "drop" in q_lower or "why" in q_lower:
            if not report.cliff_reports:
                return "Good news! No major retention cliffs were detected in this video. The retention curve held remarkably steady."

            first_cliff = report.cliff_reports[0]
            ts = f"{int(first_cliff.cliff.timestamp_start // 60):02d}:{int(first_cliff.cliff.timestamp_start % 60):02d}"
            return (
                f"Looking at your most severe cliff at **{ts}** (-{first_cliff.cliff.drop_percentage:.1f}% drop):\n\n"
                f"**Root Cause:** {first_cliff.root_cause}\n\n"
                f"**Visual Diagnosis:** {first_cliff.visual_analysis}\n\n"
                f"**Recommended Edit:** {first_cliff.recommendations[0] if first_cliff.recommendations else 'Tighten cuts and insert B-roll.'}"
            )

        if "action" in q_lower or "fix" in q_lower or "improve" in q_lower or "next" in q_lower:
            lines = ["Here are your highest-priority editing actions ranked by retention impact:\n"]
            for item in report.action_items[:3]:
                lines.append(f"- **[{item.priority}]**: {item.description} *(Expected Impact: {item.expected_impact})*")
            return "\n".join(lines)

        return (
            f"Regarding **'{report.video.title}'**, our 8-agent forensic audit identified "
            f"**{len(report.cliff_reports)} audience drop points**.\n\n"
            f"**Executive Takeaway:** {report.executive_summary}\n\n"
            f"Would you like me to walk through the exact cut adjustments for any specific timestamp?"
        )


studio_advisor_agent = StudioAdvisorAgent()
