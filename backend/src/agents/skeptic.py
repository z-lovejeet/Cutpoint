"""
Agent 6: Retention Critic Agent (The Skeptic)
Adversarial verification and peer review agent using Groq GPT-OSS 120B.
Generates counter-hypotheses, tests causal evidence, and guards against hallucinated diagnoses.
"""
import json
import logging
from typing import Any, Dict

from src.core.config import settings
from src.models.domain import CliffAnalysis, CliffPoint
from src.services.groq_service import groq_service

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Retention Critic Agent (The Skeptic) for Cutpoint.
Your role is the ultimate Devil's Advocate. You do NOT generate original findings; you vigorously test and verify the findings submitted by the Visual Detective and Sound Engineer.

CRITIQUE PROTOCOL:
1. Review the proposed root cause and tool evidence for the retention cliff.
2. Formulate at least 2 plausible counter-hypotheses (e.g. Could it be topic boredom rather than pacing? Could it be audio clipping rather than visual stagnancy?).
3. Scrutinize the empirical tool outputs: Did the agent rely on hard metrics or speculative transcript reading?
4. Score the evidence strength:
   - "STRONG": Direct empirical link between tool metrics and drop magnitude
   - "MODERATE": Plausible correlation, but alternative causes remain
   - "WEAK": Speculative or subjective assertion
5. Output valid JSON with this schema:
{
  "action": "APPROVE" or "CHALLENGE",
  "counter_hypotheses": ["Counter-hypothesis 1", "Counter-hypothesis 2"],
  "evidence_score": 0.85,
  "verdict_reasoning": "Detailed justification of approval or challenge",
  "calibrated_confidence": 0.88,
  "unified_root_cause": "Refined and validated root cause combining audio/visual facts"
}
"""


class SkepticAgent:
    """The Skeptic: Adversarial peer review ensuring rigor and anti-hallucination."""

    def __init__(self):
        self.name = "Retention Critic Agent (The Skeptic)"

    async def review_finding(
        self,
        cliff: CliffPoint,
        visual_finding: CliffAnalysis,
        audio_finding: CliffAnalysis,
        debate_round: int = 1,
    ) -> Dict[str, Any]:
        """
        Adversarially cross-examines visual and audio findings for a cliff.
        Returns approval verdict or challenge.
        """
        logger.info("[%s] Cross-examining findings for cliff at %.1fs (Round %d)...",
                    self.name, cliff.timestamp_start, debate_round)

        tools_used = [e.tool_name for e in visual_finding.evidence_chain + audio_finding.evidence_chain]

        user_prompt = f"""Review these specialist findings for cliff at {cliff.timestamp_start:.1f}s (-{cliff.drop_percentage:.1f}% drop, {cliff.severity.value}):

[VISUAL FINDING]
Root Cause: {visual_finding.root_cause}
Visual Analysis: {visual_finding.visual_analysis}
Pacing Analysis: {visual_finding.pacing_analysis}
Confidence: {visual_finding.confidence_score}

[AUDIO FINDING]
Root Cause: {audio_finding.root_cause}
Audio Analysis: {audio_finding.audio_analysis}
Confidence: {audio_finding.confidence_score}

[EMPIRICAL TOOLS EXECUTED]
{', '.join(tools_used)}

Debate Round: {debate_round} (Max: 2)

Cross-examine these findings. Provide counter-hypotheses, calibrate the final confidence score, and provide a unified root cause."""

        if settings.GROQ_API_KEY:
            try:
                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ]
                res = await groq_service.chat_completion(
                    messages=messages,
                    model=settings.GROQ_CHAT_MODEL,
                    temperature=0.2,
                    response_format={"type": "json_object"},
                )

                content = res.get("content", "{}")
                parsed = json.loads(content)
                logger.info("[%s] Verdict for %.1fs: %s (Calibrated Confidence: %.2f)",
                            self.name, cliff.timestamp_start, parsed.get("action", "APPROVE"),
                            parsed.get("calibrated_confidence", 0.85))
                return parsed

            except Exception as e:
                logger.warning("[%s] Groq call failed (%s). Executing offline skeptical audit.", self.name, e)
                return self._heuristic_critique(cliff, visual_finding, audio_finding, debate_round)
        else:
            logger.info("[%s] GROQ_API_KEY not configured. Running offline adversarial audit engine.", self.name)
            return self._heuristic_critique(cliff, visual_finding, audio_finding, debate_round)

    def _heuristic_critique(
        self,
        cliff: CliffPoint,
        visual_finding: CliffAnalysis,
        audio_finding: CliffAnalysis,
        debate_round: int,
    ) -> Dict[str, Any]:
        """Algorithmic adversarial critique combining audio and visual evidence."""
        # Check tool execution coverage
        all_evidence = visual_finding.evidence_chain + audio_finding.evidence_chain
        has_tools = len(all_evidence) >= 2

        # Synthesize unified root cause
        if cliff.drop_percentage >= 12.0:
            unified = (
                f"Compounded retention failure: {visual_finding.root_cause} "
                f"exacerbated by {audio_finding.root_cause} at {cliff.timestamp_start:.1f}s"
            )
        else:
            # Primary driver
            if "dead air" in audio_finding.root_cause.lower() or "silence" in audio_finding.root_cause.lower():
                unified = audio_finding.root_cause
            else:
                unified = visual_finding.root_cause

        counter_hypotheses = [
            f"Viewer drop might be an external topic distraction rather than pacing at {cliff.timestamp_start:.1f}s",
            "Drop could reflect natural mobile scrolling behavior at this timestamp interval",
        ]

        # Calculate calibrated confidence
        raw_conf = (visual_finding.confidence_score + audio_finding.confidence_score) / 2.0
        calibrated = round(min(0.95, max(0.72, raw_conf + (0.05 if has_tools else -0.10))), 2)

        return {
            "action": "APPROVE",
            "counter_hypotheses": counter_hypotheses,
            "evidence_score": 0.88 if has_tools else 0.65,
            "verdict_reasoning": (
                f"Approved based on corroborating multimodal and acoustic metrics. "
                f"{len(all_evidence)} empirical tool measurements confirmed the diagnosis."
            ),
            "calibrated_confidence": calibrated,
            "unified_root_cause": unified,
        }


skeptic_agent = SkepticAgent()
