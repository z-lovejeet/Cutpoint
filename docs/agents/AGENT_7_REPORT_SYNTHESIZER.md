# Agent 7: Report Synthesizer Agent (The Executive Editor)

## 1. Agent Identity
- **Name:** Report Synthesizer Agent
- **Role:** The Executive Editor
- **Model:** Groq GPT-OSS 20B (`openai/gpt-oss-20b`) — chosen for extremely fast structured output generation and excellent adherence to JSON schemas.
- **Fallback:** `groq/compound-mini`

## 2. Purpose
The Report Synthesizer Agent is the final stage of the Cutpoint investigation pipeline. It compiles all verified findings from the mathematical detection and multi-modal investigation pipelines into a polished, professional Forensic Retention Report. 

This agent is **NOT** a simple JSON formatter. It synthesizes complex multi-dimensional data, narrates the viewer's experience, computes health metrics, and prescribes actionable, timestamp-specific editing recommendations.

## 3. Autonomous Behaviors
- **Narrative Synthesis:** Weaves individual, disjointed cliff findings into a cohesive narrative about the video's retention issues, explaining the overall pacing and structural flaws.
- **Prescription Specificity:** Translates diagnoses into precise, timestamp-specific editing recommendations (e.g., "Cut the b-roll sequence between 04:12 and 04:18" instead of generic advice like "Improve pacing").
- **Health Score Calculation:** Computes a comprehensive 0-100 Retention Health Score using a weighted mathematical formula based on drop severity, early-drop penalties, and cliff density.
- **Coherence Checking:** Autonomously validates the draft report to ensure it doesn't contradict itself, repeat findings unnecessarily, or hallucinate fixes for non-existent cliffs.
- **Iterative Refinement:** Implements a self-reflection loop. If the initial draft fails quality checks (e.g., missing evidence or conflicting statements), it triggers targeted rewrites of specific sections.
- **Priority Ranking:** Orders global action items dynamically based on their expected impact on retention improvement and implementation effort.

## 4. Report Structure (`ForensicReport` Schema)

The final output is governed by a strict Pydantic schema, structured as follows:

### Executive Summary
- **Video Metadata:** Title, duration, views.
- **Overall Health:** Score with an A-F letter grade.
- **Narrative:** A concise, one-paragraph summary of the core findings.
- **Top 3 Action Items:** The highest-leverage changes.

### Retention Health Score
- **Score:** 0-100 overall metric.
- **Breakdown:** Sub-scores (0-100) for `content_score`, `pacing_score`, `audio_score`, `visual_score`, `hook_score`.
- **Comparison Guidance:** Contextual benchmarks for interpreting the scores.

### Cliff Map
An array of detailed entries for each identified retention cliff:
- **Metrics:** Timestamp, drop %, severity classification, and confidence score.
- **Root Cause:** The verified hypothesis from the Critic Agent.
- **Visual Evidence:** Summary from the Multimodal Forensic Agent.
- **Audio Evidence:** Summary from the Audio & Cadence Agent.
- **Specific Fix:** Targeted editing recommendation with precise timestamps.

### Global Action Items
- **Prioritized List:** 3-5 macro-level improvements spanning the whole video.
- **Details:** Priority (`P0`/`P1`/`P2`), category (e.g., Audio, Visual, Pacing), description, and expected impact.

### Methodology Note
- **Pipeline Details:** Which agents participated in the analysis.
- **Confidence Metrics:** Average confidence levels across findings.
- **Caveats:** Any identified limitations or missing data points.

## 5. Health Score Formula

The Retention Health Score is calculated using a deterministic, weighted formula before being fed to the LLM for contextualization:

```python
score = 100 - Σ (drop_severity_weight × cliff_drop_percentage × confidence)
```

**Penalty Adjustments:**
1. **Cliff Count Penalty:** `- (total_cliffs × 1.5)`
2. **First-30-Seconds Penalty:** Early drops (within the first 30 seconds) apply a `2.5x` multiplier to the standard `drop_severity_weight`.
3. **Cliff Clustering Penalty:** Multiple cliffs occurring within a 60-second window incur an additional `5` point penalty per cluster, indicating severe pacing issues.

## 6. System Prompt

```text
You are the Executive Editor (Report Synthesizer Agent) for the Cutpoint retention forensics platform.
Your job is to compile raw forensic findings from a team of AI specialists into a final, polished Forensic Retention Report.

You will receive:
1. Video Metadata
2. Verified Cliff Findings (including visual, audio, and critic analysis)
3. Computed Health Scores

Your Output Requirements:
1. SYNTHESIS: Do not just list findings. Weave them into a coherent narrative. Explain *why* the video is losing viewers overall.
2. SPECIFICITY: All editing recommendations MUST be specific to timestamps. Never use generic advice like "make it more engaging." Instead, say "Cut the dead air from 02:15 to 02:19."
3. COHERENCE: Ensure your narrative does not contradict the specific cliff findings.
4. PRIORITIZATION: Rank the Global Action Items strictly by their expected impact on overall viewer retention. High-drop cliffs early in the video are P0.
5. FORMAT: You must adhere strictly to the provided JSON schema.

Do not hallucinate data. Only use the evidence provided in the input payload.
If evidence for a specific modality is missing, note it in the methodology section rather than guessing.
```

## 7. Complete Implementation

```python
import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import groq
from groq import AsyncGroq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ReportSynthesizerAgent")

# --- 8. Data Models ---

class HealthScore(BaseModel):
    overall: float = Field(..., description="Overall score 0-100")
    grade: str = Field(..., description="Letter grade A-F")
    content_score: float
    pacing_score: float
    audio_score: float
    visual_score: float
    hook_score: float
    comparison_guidance: str = Field(..., description="Context for the score")

class CliffReport(BaseModel):
    timestamp: str = Field(..., description="e.g., 04:15")
    drop_percentage: float
    severity: str
    confidence: float
    root_cause: str
    visual_evidence_summary: str
    audio_evidence_summary: str
    specific_fix_recommendation: str
    target_timestamps: str = Field(..., description="Timestamps to edit, e.g., 04:12 - 04:18")

class ActionItem(BaseModel):
    priority: str = Field(..., description="P0, P1, or P2")
    category: str = Field(..., description="e.g., Pacing, Audio, Visual")
    description: str
    expected_impact: str
    related_cliff_timestamp: Optional[str]

class ExecutiveSummary(BaseModel):
    video_title: str
    duration: str
    views: int
    overall_health_score: float
    grade: str
    narrative_summary: str
    top_3_action_items: List[str]

class MethodologyNote(BaseModel):
    agents_involved: List[str]
    average_confidence: float
    caveats: str

class ForensicReport(BaseModel):
    executive_summary: ExecutiveSummary
    health_score: HealthScore
    cliff_reports: List[CliffReport]
    action_items: List[ActionItem]
    methodology_note: MethodologyNote
    generated_at: str

# --- 7. Agent Implementation ---

class ReportSynthesizerAgent:
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "gpt-oss-20b" # Or relevant fast model available on Groq
        self.system_prompt = """
        You are the Executive Editor for the Cutpoint retention forensics platform.
        Your job is to compile raw forensic findings into a polished Forensic Retention Report.
        Provide synthesis, specific timestamped prescriptions, and ensure narrative coherence.
        Rank action items by impact. Output exactly matching the required JSON schema.
        """

    def calculate_health_score(self, metadata: Dict, verified_cliffs: List[Dict]) -> Dict:
        """
        Computes the mathematical health score before LLM processing.
        """
        logger.info("Calculating objective health score...")
        base_score = 100.0
        total_cliffs = len(verified_cliffs)
        
        penalty_sum = 0
        previous_cliff_time = -999

        for cliff in verified_cliffs:
            drop_pct = cliff.get("drop_percentage", 0)
            confidence = cliff.get("confidence", 0.8)
            time_sec = self._parse_time(cliff.get("timestamp", "00:00"))
            
            weight = 1.0
            
            # Early drop penalty
            if time_sec <= 30:
                weight = 2.5
            
            # Base penalty for the cliff
            penalty = weight * drop_pct * confidence
            penalty_sum += penalty
            
            # Cluster penalty
            if (time_sec - previous_cliff_time) <= 60 and previous_cliff_time != -999:
                penalty_sum += 5.0
            
            previous_cliff_time = time_sec

        # Cliff count penalty
        penalty_sum += (total_cliffs * 1.5)
        
        final_score = max(0.0, min(100.0, base_score - penalty_sum))
        
        return {
            "overall": round(final_score, 1),
            "grade": self._assign_grade(final_score),
            # Mock sub-scores for demonstration, usually derived from specific agent confidences
            "content_score": round(max(0, final_score + 5), 1),
            "pacing_score": round(max(0, final_score - 10), 1),
            "audio_score": round(max(0, final_score + 2), 1),
            "visual_score": round(max(0, final_score - 5), 1),
            "hook_score": round(max(0, final_score - (15 if previous_cliff_time <= 30 else 0)), 1)
        }

    def _parse_time(self, time_str: str) -> int:
        parts = time_str.split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return 0

    def _assign_grade(self, score: float) -> str:
        if score >= 90: return "A"
        if score >= 80: return "B"
        if score >= 70: return "C"
        if score >= 60: return "D"
        return "F"

    async def generate_draft_report(self, payload: str) -> str:
        """
        Generates the initial structured report using Groq.
        """
        logger.info("Generating draft report via Groq...")
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Generate the ForensicReport based on this data: {payload}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=4000
        )
        return response.choices[0].message.content

    async def quality_check(self, draft_json: str) -> bool:
        """
        Validates the draft for coherence and schema compliance.
        In a full implementation, this might use a smaller LLM to evaluate the draft.
        """
        logger.info("Performing quality check on draft report...")
        try:
            data = json.loads(draft_json)
            # Schema validation
            ForensicReport(**data)
            
            # Simple heuristic coherence check: ensure P0 action items reference severe cliffs
            action_items = data.get("action_items", [])
            has_p0 = any(item.get("priority") == "P0" for item in action_items)
            cliffs = data.get("cliff_reports", [])
            has_severe_cliff = any(cliff.get("severity") in ["High", "Critical"] for cliff in cliffs)
            
            if has_severe_cliff and not has_p0:
                logger.warning("Coherence Check Failed: Severe cliffs exist but no P0 action items defined.")
                return False
                
            return True
        except Exception as e:
            logger.error(f"Quality check failed: {str(e)}")
            return False

    async def synthesize_narrative(self, metadata: Dict, verified_cliffs: List[Dict]) -> ForensicReport:
        """
        Main pipeline to compile, score, format, and synthesize the final report.
        """
        # 1. Calculate deterministic scores
        health_metrics = self.calculate_health_score(metadata, verified_cliffs)
        
        # 2. Prepare payload for LLM
        payload = json.dumps({
            "metadata": metadata,
            "calculated_health": health_metrics,
            "verified_cliffs": verified_cliffs
        })
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # 3. Generate Draft
                draft_json = await self.generate_draft_report(payload)
                
                # 4. Check Coherence & Quality
                is_valid = await self.quality_check(draft_json)
                
                if is_valid:
                    logger.info("Draft passed quality checks. Finalizing report.")
                    report_data = json.loads(draft_json)
                    report_data['generated_at'] = datetime.utcnow().isoformat()
                    return ForensicReport(**report_data)
                else:
                    logger.warning(f"Draft failed quality checks. Retrying... (Attempt {attempt+1}/{max_retries})")
                    # In a robust system, we would pass feedback to the LLM here
                    
            except Exception as e:
                logger.error(f"Error during synthesis attempt {attempt+1}: {e}")
                
        raise RuntimeError("Failed to generate a coherent report after multiple attempts.")

    async def run(self, metadata: Dict, verified_cliffs: List[Dict]) -> ForensicReport:
        """
        Entry point for the Agent.
        """
        logger.info("ReportSynthesizerAgent started.")
        report = await self.synthesize_narrative(metadata, verified_cliffs)
        logger.info("ReportSynthesizerAgent finished successfully.")
        return report

# Example Usage
async def main():
    agent = ReportSynthesizerAgent(api_key="YOUR_GROQ_API_KEY")
    
    # Mock Input Data
    meta = {"title": "React vs Vue", "duration": "12:05", "views": 45000}
    cliffs = [
        {
            "timestamp": "00:45", "drop_percentage": 15.2, "severity": "High", "confidence": 0.95,
            "root_cause": "Long intro sequence without hook payoff.",
            "visual_evidence_summary": "Static logo screen for 8 seconds.",
            "audio_evidence_summary": "No speech, just generic lofi music.",
            "specific_fix_recommendation": "Cut logo sequence entirely.",
            "target_timestamps": "00:40 - 00:48"
        }
    ]
    
    # Generate Report
    # report = await agent.run(metadata=meta, verified_cliffs=cliffs)
    # print(report.json(indent=2))

if __name__ == "__main__":
    asyncio.run(main())
```
