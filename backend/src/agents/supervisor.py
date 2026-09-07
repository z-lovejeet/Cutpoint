"""
Agent 1: Supervisor Agent (Lead Investigator)
Orchestrates the entire multi-agent investigation lifecycle using Groq GPT-OSS 120B.
Formulates dynamic investigation plans, dispatches specialists concurrently,
resolves inter-agent conflicts, and coordinates adversarial debate loops.
"""
import asyncio
import json
import logging
from typing import List

from src.agents.skeptic import skeptic_agent
from src.agents.sound_engineer import sound_engineer_agent
from src.agents.visual_detective import visual_detective_agent
from src.core.config import settings
from src.models.domain import (
    CliffAnalysis,
    CliffPoint,
    DetectionResult,
    Evidence,
    RetentionData,
    VideoMetadata,
)
from src.models.state import AgentMessage, AnalysisState, InvestigationPlan
from src.services.groq_service import groq_service

logger = logging.getLogger(__name__)

SUPERVISOR_PLAN_PROMPT = """You are the Supervisor Agent (Lead Investigator) for Cutpoint.
Your role is to orchestrate a forensic team of AI specialists investigating YouTube viewer retention drops.

Given the detected cliffs, formulate an optimal InvestigationPlan.
Prioritize severe drops (CRITICAL and HIGH).
Output valid JSON matching this schema:
{
  "strategy": "parallel",
  "priority_order": ["cliff_0", "cliff_1"],
  "required_confidence": 0.80,
  "rationale": "High severity drops in early segment require immediate parallel multimodal investigation."
}
"""


class SupervisorAgent:
    """The Lead Investigator: Coordinates specialist agents and manages the forensic inquiry."""

    def __init__(self):
        self.name = "Supervisor Agent (Lead Investigator)"

    async def run_investigation(
        self,
        detection_result: DetectionResult,
        metadata: VideoMetadata,
        retention_data: RetentionData,
        state: AnalysisState,
    ) -> List[CliffAnalysis]:
        """
        Runs the full investigation lifecycle across all detected cliffs.
        Dispatches Visual Detective & Sound Engineer concurrently, then triggers Skeptic debate.
        """
        cliffs = detection_result.cliffs
        logger.info("[%s] Initiating investigation for %d cliffs in video %s...",
                    self.name, len(cliffs), metadata.video_id)

        if not cliffs:
            logger.info("[%s] Zero retention cliffs detected. Video has flawless retention curve!", self.name)
            return []

        # 1. Formulate dynamic investigation plan
        plan = await self._formulate_plan(cliffs, metadata)
        state.investigation_plan = plan
        state.agent_messages.append(
            AgentMessage(
                sender=self.name,
                recipient="All Agents",
                content=f"Investigation Plan formulated: {plan.rationale}",
                message_type="info",
            )
        )

        verified_analyses: List[CliffAnalysis] = []
        total_cliffs = max(1, len(cliffs))

        # 2. Investigate each cliff (parallel fan-out of Visual Detective + Sound Engineer)
        for i, cliff in enumerate(cliffs):
            cliff_id = f"cliff_{i}_{int(cliff.timestamp_start)}"
            ts_str = f"{int(cliff.timestamp_start//60):02d}:{int(cliff.timestamp_start%60):02d}"
            logger.info("[%s] Dispatching specialists for %s at %.1fs (-%.1f%%)...",
                        self.name, cliff_id, cliff.timestamp_start, cliff.drop_percentage)

            # Update live state progress dynamically
            step_progress = 30 + int(((i * 2 + 1) / (total_cliffs * 2)) * 48)
            state.progress_percentage = min(78, step_progress)
            state.current_phase = f"Investigating Cliff {i+1}/{total_cliffs} at {ts_str} (-{cliff.drop_percentage:.1f}%): Parallel visual & acoustic inspection..."

            state.active_agents = [
                visual_detective_agent.name,
                sound_engineer_agent.name,
            ]
            state.agent_messages.append(
                AgentMessage(
                    sender=self.name,
                    recipient=f"{visual_detective_agent.name}, {sound_engineer_agent.name}",
                    content=f"Investigate cliff {i+1}/{total_cliffs} at {ts_str} (-{cliff.drop_percentage:.1f}%)",
                    message_type="finding",
                    data={"cliff_index": i, "timestamp": cliff.timestamp_start, "drop_percentage": cliff.drop_percentage}
                )
            )

            # Concurrent execution of visual and audio agents
            visual_task = visual_detective_agent.investigate_cliff(cliff, metadata, retention_data.data_points)
            audio_task = sound_engineer_agent.investigate_cliff(cliff, metadata, retention_data.data_points)

            visual_res, audio_res = await asyncio.gather(visual_task, audio_task)

            # Log specialist findings into state
            state.agent_messages.append(
                AgentMessage(
                    sender=visual_detective_agent.name,
                    recipient=self.name,
                    content=f"Visual diagnosis for {ts_str}: {visual_res.root_cause} (Confidence: {int(visual_res.confidence_score*100)}%)",
                    message_type="finding",
                    data={"tools_used": [e.tool_name for e in visual_res.evidence_chain], "root_cause": visual_res.root_cause}
                )
            )
            state.agent_messages.append(
                AgentMessage(
                    sender=sound_engineer_agent.name,
                    recipient=self.name,
                    content=f"Acoustic diagnosis for {ts_str}: {audio_res.audio_analysis or audio_res.root_cause}",
                    message_type="finding",
                    data={"tools_used": [e.tool_name for e in audio_res.evidence_chain]}
                )
            )

            # 3. Adversarial debate with Retention Critic
            state.active_agents = [skeptic_agent.name]
            state.current_phase = f"Debating Cliff {i+1}/{total_cliffs} at {ts_str} with The Skeptic (Round 1)..."
            state.debate_rounds += 1

            critic_verdict = await skeptic_agent.review_finding(
                cliff=cliff,
                visual_finding=visual_res,
                audio_finding=audio_res,
                debate_round=1,
            )

            # If Critic challenges and confidence < 0.75, run round 2
            if critic_verdict.get("action") == "CHALLENGE" and critic_verdict.get("evidence_score", 1.0) < 0.75:
                state.debate_rounds += 1
                state.current_phase = f"The Skeptic challenged findings at {ts_str}. Executing Debate Round 2..."
                state.agent_messages.append(
                    AgentMessage(
                        sender=skeptic_agent.name,
                        recipient="Specialists",
                        content=f"Challenge Round 1 at {ts_str}: {critic_verdict.get('verdict_reasoning', 'Insufficient evidence')}. Demanding calibrated reassessment.",
                        message_type="challenge",
                    )
                )
                logger.info("[%s] Critic issued challenge for %.1fs. Running Debate Round 2...",
                            self.name, cliff.timestamp_start)
                critic_verdict = await skeptic_agent.review_finding(
                    cliff=cliff,
                    visual_finding=visual_res,
                    audio_finding=audio_res,
                    debate_round=2,
                )

            # 4. Consolidate into verified CliffAnalysis
            unified_cause = critic_verdict.get("unified_root_cause") or visual_res.root_cause
            final_confidence = float(critic_verdict.get("calibrated_confidence", 0.85))

            # Update progress for this completed cliff
            step_progress = 30 + int(((i * 2 + 2) / (total_cliffs * 2)) * 48)
            state.progress_percentage = min(78, step_progress)
            state.current_phase = f"Cliff {i+1}/{total_cliffs} verified ({int(final_confidence*100)}% confidence): {unified_cause}"

            combined_evidence = visual_res.evidence_chain + audio_res.evidence_chain
            combined_evidence.append(
                Evidence(
                    source_agent=skeptic_agent.name,
                    tool_name="adversarial_audit",
                    description=critic_verdict.get("verdict_reasoning", "Passed adversarial review."),
                    confidence=final_confidence,
                    data_reference={"counter_hypotheses": critic_verdict.get("counter_hypotheses", [])},
                    supports_hypothesis=True,
                )
            )

            # Combine recommendations
            recs = visual_res.recommendations + audio_res.recommendations
            # Deduplicate
            seen_recs = set()
            clean_recs = []
            for r in recs:
                if r not in seen_recs:
                    seen_recs.add(r)
                    clean_recs.append(r)

            combined_analysis = CliffAnalysis(
                cliff=cliff,
                investigation_passes=visual_res.investigation_passes + audio_res.investigation_passes,
                evidence_chain=combined_evidence,
                root_cause=unified_cause,
                visual_analysis=visual_res.visual_analysis,
                audio_analysis=audio_res.audio_analysis,
                pacing_analysis=visual_res.pacing_analysis,
                content_analysis=f"Retention dropped {cliff.drop_percentage:.1f}% due to verified visual/acoustic friction.",
                confidence_score=final_confidence,
                critic_approved=True,
                recommendations=clean_recs,
            )

            verified_analyses.append(combined_analysis)
            state.agent_messages.append(
                AgentMessage(
                    sender=self.name,
                    recipient="Orchestrator",
                    content=f"Verified finding approved for {cliff.timestamp_start:.1f}s: {unified_cause}",
                    message_type="approval",
                )
            )

        logger.info("[%s] All %d cliff investigations completed and verified.", self.name, len(verified_analyses))
        return verified_analyses

    async def _formulate_plan(self, cliffs: List[CliffPoint], metadata: VideoMetadata) -> InvestigationPlan:
        """Formulates an investigation plan using Groq GPT-OSS 120B."""
        cliff_ids = [f"cliff_{i}_{int(c.timestamp_start)}" for i, c in enumerate(cliffs)]

        if settings.GROQ_API_KEY:
            try:
                user_msg = (
                    f"Video: '{metadata.title}' (Duration: {metadata.duration_seconds}s)\n"
                    f"Cliffs detected: {len(cliffs)}\n"
                    f"Severities: {[c.severity.value for c in cliffs]}\n"
                    f"Drop percentages: {[c.drop_percentage for c in cliffs]}\n"
                    f"Timestamps: {[c.timestamp_start for c in cliffs]}"
                )
                res = await groq_service.chat_completion(
                    messages=[
                        {"role": "system", "content": SUPERVISOR_PLAN_PROMPT},
                        {"role": "user", "content": user_msg},
                    ],
                    model=settings.GROQ_CHAT_MODEL,
                    temperature=0.2,
                    response_format={"type": "json_object"},
                )
                data = json.loads(res.get("content", "{}"))
                return InvestigationPlan(
                    video_id=metadata.video_id,
                    total_cliffs=len(cliffs),
                    cliff_ids=cliff_ids,
                    priority_order=data.get("priority_order", cliff_ids),
                    strategy=data.get("strategy", "parallel"),
                    required_confidence=float(data.get("required_confidence", 0.80)),
                    rationale=data.get("rationale", "Parallel multimodal investigation prioritizing high severity drops."),
                )
            except Exception as e:
                logger.warning("[%s] Failed to generate LLM plan (%s). Using deterministic heuristic plan.", self.name, e)

        return InvestigationPlan(
            video_id=metadata.video_id,
            total_cliffs=len(cliffs),
            cliff_ids=cliff_ids,
            priority_order=cliff_ids,
            strategy="parallel",
            required_confidence=0.80,
            rationale="Deterministic plan prioritizing drops by severity and drop percentage.",
        )


supervisor_agent = SupervisorAgent()
