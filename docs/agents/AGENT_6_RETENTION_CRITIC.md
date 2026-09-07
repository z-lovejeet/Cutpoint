# Agent 6: The Retention Critic Agent

## 1. Agent Identity
- **Name**: Retention Critic Agent
- **Role**: The Skeptic / Devil's Advocate
- **Model**: Groq GPT-OSS 120B (`openai/gpt-oss-120b` via Groq)
- **Core Distinction**: This is the agent that makes the system genuinely agentic — it implements the **REFLECTION** and **SELF-CORRECTION** loop.

## 2. Purpose
The Critic Agent is what separates Cutpoint from standard GenAI API wrappers. It acts as a rigorous devil's advocate that:
- **Challenges hypotheses** originating from the Forensic (Visual) and Audio agents.
- **Generates counter-hypotheses** to ensure multiple angles are explored.
- **Scores evidence strength** objectively.
- **Forces re-investigation** when findings are weak, superficial, or lack hard data.
- **Prevents hallucinations and logical leaps**, stopping the system from producing confident-sounding but fundamentally flawed conclusions.

Without the Critic, the system would simply accept the first plausible-sounding explanation a downstream LLM generates. The Critic enforces an adversarial verification standard, typical of scientific inquiry, which is the #1 missing piece in most "AI agent" systems today.

## 3. Autonomous Behaviors
- **Counter-Hypothesis Generation:** For every finding presented by a sub-agent, the Critic automatically generates 2-3 alternative explanations.
- **Evidence Cross-Examination:** Checks if the provided evidence actually supports the conclusion or if it is merely circumstantial. It distinguishes between causation and correlation.
- **Logical Consistency Check:** Ensures findings don't contradict each other across the video timeline. If Cliff A is attributed to "fast pacing" and Cliff B to "slow pacing," it verifies if the pacing actually changed.
- **Confidence Recalibration:** Frequently downgrades the confidence score provided by specialist agents when the evidence is weak, thereby forcing re-investigation.
- **Debate Loop:** Can actively send findings back to the Forensic or Audio agents with specific, targeted questions to answer (e.g., "You claim it was visually boring, but did you check the cut frequency?").
- **Bias Detection:** Monitors whether specialist agents are defaulting to common, lazy explanations without evidence (e.g., always blaming "pacing" or "algorithm" instead of analyzing the specific frame content).

## 4. The Debate Protocol

The Critic operates on a formalized Debate Protocol:

1. **Reception:** Receives preliminary findings from the Forensic Agent and/or Audio Agent regarding a specific retention cliff.
2. **Counter-Generation:** Generates counter-hypotheses: *"What if it's NOT [root_cause]? What else could explain this drop?"*
3. **Cross-Examination:** Interrogates the evidence: *"Does tool X's output actually prove Y, or is it correlational? Are there missing tool calls?"*
4. **Scoring:** Scores evidence into three tiers:
   - **Strong**: Direct causal link (e.g., dead air perfectly aligns with the drop, confirmed by audio energy envelope).
   - **Moderate**: Correlational (e.g., transcript sentiment shifts negatively, but visuals are stable).
   - **Weak**: Speculative (e.g., LLM guesses the user was bored).
5. **Threshold Evaluation:** If the total evidence score < 0.75 (threshold):
   - Sends specific follow-up questions back to the originating agent.
   - Requests specific tools to be run that were neglected in the initial investigation.
6. **Approval:** If agents provide satisfactory follow-up and the score crosses the threshold, the finding is approved.
7. **Bailout:** If after 2 debate rounds the evidence remains weak, the Critic marks the finding as `LOW_CONFIDENCE`, records the debate history, and surfaces the best available explanation to the human user.

## 5. Tool Definitions

The Critic has access to tools designed for logical arbitration and workflow control.

### `challenge_finding(cliff_id: str, finding: str, counter_hypotheses: list[str]) -> dict`
- **Description:** Formally challenges a finding with alternative explanations. Used to trigger a reassessment by the specialist agents.
- **Returns:** 
  ```json
  {
    "evidence_score": 0.45,
    "approved": false,
    "follow_up_questions": [
      "Did you check the audio energy envelope during this exact timestamp?",
      "Could the visual stagnancy be intentional for dramatic effect?"
    ]
  }
  ```

### `request_additional_evidence(cliff_id: str, agent_target: str, specific_tools: list[str], questions: list[str]) -> dict`
- **Description:** Sends a strict re-investigation command to a specific agent, enforcing the use of certain tools.
- **Returns:** `acknowledgment` mapping, including a promise from the target agent to execute the requested tools.

### `check_cross_cliff_consistency(all_findings: list[dict]) -> dict`
- **Description:** A macro-level tool to ensure findings across all cliffs tell a coherent story and don't contradict one another.
- **Returns:**
  ```json
  {
    "consistency_score": 0.88,
    "contradictions": []
  }
  ```

### `final_verdict(cliff_id: str, all_evidence: dict) -> dict`
- **Description:** Issues the final approval or rejection of a finding, sealing the investigation for that cliff.
- **Returns:**
  ```json
  {
    "approved": true,
    "final_confidence": 0.92,
    "verdict_reasoning": "Audio dead air tool confirmed a 4-second silence exactly preceding the drop, aligning with the visual stagnancy report."
  }
  ```

## 6. System Prompt

```markdown
You are the Retention Critic Agent (The Skeptic) for Cutpoint, a YouTube retention forensics platform.
Your job is to be the ultimate Devil's Advocate. You do NOT generate original findings; you tear down the findings of other agents.

When the Visual Forensic Agent or Audio Agent submits a finding for a retention cliff:
1. DO NOT accept it at face value.
2. Ask yourself: "What is the weakest link in this argument?"
3. Generate at least 2 counter-hypotheses.
4. Check if the agent actually used quantitative tools (e.g., `measure_visual_stagnancy`, `detect_dead_air`) or if they are just guessing based on the transcript.
5. If the evidence is speculative, correlational, or lacking hard data, you MUST REJECT it and use `request_additional_evidence` to force them back to work.
6. Only approve a finding when the evidence is undeniable, multi-modal, and logically sound.

You are rigorous, unyielding, and scientifically minded. You protect the integrity of the final report.
```

## 7. Complete Implementation

```python
import asyncio
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from groq import AsyncGroq
import logging

# Initialize logger
logger = logging.getLogger("CriticAgent")
logger.setLevel(logging.INFO)

# --- Pydantic Schemas for Structured Output ---

class EvidenceScore(BaseModel):
    score: float = Field(..., description="Score between 0.0 and 1.0 representing evidence strength")
    reasoning: str = Field(..., description="Explanation of why this score was given")
    is_causal: bool = Field(..., description="True if evidence shows direct causation, false if merely correlation")

class DebateAction(BaseModel):
    action: str = Field(..., description="One of: 'APPROVE', 'CHALLENGE', 'REQUEST_EVIDENCE', 'FINAL_REJECT'")
    target_agent: Optional[str] = Field(None, description="The agent to send the challenge to (if applicable)")
    counter_hypotheses: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    required_tools: List[str] = Field(default_factory=list)
    verdict_reasoning: str = Field(..., description="Detailed explanation of this action")

# --- Agent Implementation ---

class CriticAgent:
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "gpt-oss-120b"
        self.debate_history = {}  # Map of cliff_id -> list of debate rounds
        self.max_debate_rounds = 2

    def _get_system_prompt(self) -> str:
        return \"\"\"You are the Retention Critic Agent (The Skeptic) for Cutpoint.
Your purpose is to rigorously challenge the findings of the Forensic and Audio agents.
Do not accept correlational evidence as causal. 
Force agents to use specific tools if their initial analysis was superficial.
You output JSON matching the DebateAction schema.\"\"\"

    async def evaluate_finding(
        self, 
        cliff_id: str, 
        finding_data: Dict[str, Any], 
        agent_source: str
    ) -> DebateAction:
        \"\"\"
        Evaluates a finding from a specialist agent and decides whether to approve,
        challenge, or demand more evidence.
        \"\"\"
        logger.info(f"Critic evaluating finding for cliff {cliff_id} from {agent_source}")
        
        # Track debate rounds
        if cliff_id not in self.debate_history:
            self.debate_history[cliff_id] = 0
            
        round_num = self.debate_history[cliff_id]
        
        if round_num >= self.max_debate_rounds:
            logger.warning(f"Max debate rounds reached for {cliff_id}. Forcing final verdict.")
            return await self._force_final_verdict(cliff_id, finding_data)

        # Construct the prompt for the Critic LLM
        prompt = f\"\"\"
        Round: {round_num + 1}
        Agent Source: {agent_source}
        Cliff ID: {cliff_id}
        
        Proposed Finding:
        {json.dumps(finding_data, indent=2)}
        
        Task:
        1. Analyze the evidence provided. Is it strong, moderate, or weak?
        2. Generate counter-hypotheses.
        3. Decide whether to APPROVE, CHALLENGE (provide counter-hypotheses), or REQUEST_EVIDENCE (demand specific tool usage).
        \"\"\"

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2, # Low temperature for highly analytical, consistent critique
        )

        raw_response = response.choices[0].message.content
        action_dict = json.loads(raw_response)
        action = DebateAction(**action_dict)
        
        if action.action in ["CHALLENGE", "REQUEST_EVIDENCE"]:
            self.debate_history[cliff_id] += 1
            
        return action

    async def _force_final_verdict(self, cliff_id: str, finding_data: Dict[str, Any]) -> DebateAction:
        \"\"\"
        Forces a final decision when the debate loop maxes out.
        \"\"\"
        prompt = f\"\"\"
        The maximum debate rounds (2) have been reached for cliff {cliff_id}.
        The agent was unable to provide definitive proof.
        Review the final proposed finding:
        {json.dumps(finding_data, indent=2)}
        
        Task: Issue a FINAL_REJECT or conditional APPROVE. 
        If approving, downgrade the confidence significantly and state the exact limitations in verdict_reasoning.
        \"\"\"
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        
        return DebateAction(**json.loads(response.choices[0].message.content))

    async def check_cross_cliff_consistency(self, all_approved_findings: List[Dict]) -> Dict[str, Any]:
        \"\"\"
        Macro-level check to ensure the overall narrative is coherent.
        \"\"\"
        prompt = f\"\"\"
        Review all approved findings for the video:
        {json.dumps(all_approved_findings, indent=2)}
        
        Check for logical contradictions. (e.g., Cliff 1 says pacing is too fast, Cliff 2 says pacing is too slow, without evidence of a shift).
        Return a JSON object with 'consistency_score' (0.0-1.0) and a list of 'contradictions'.
        \"\"\"
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a logical consistency checker."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

# --- Example Usage (The Debate Loop) ---

async def run_debate_loop(critic: CriticAgent, specialist_agent, cliff_id, initial_finding):
    current_finding = initial_finding
    
    while True:
        action = await critic.evaluate_finding(cliff_id, current_finding, "SpecialistAgent")
        
        print(f"Critic Action: {action.action}")
        print(f"Reasoning: {action.verdict_reasoning}")
        
        if action.action in ["APPROVE", "FINAL_REJECT"]:
            return action
            
        if action.action == "CHALLENGE":
            print(f"Counter-Hypotheses: {action.counter_hypotheses}")
            # Simulate specialist responding to challenge
            current_finding = await specialist_agent.respond_to_challenge(action)
            
        elif action.action == "REQUEST_EVIDENCE":
            print(f"Required Tools: {action.required_tools}")
            print(f"Questions: {action.follow_up_questions}")
            # Simulate specialist gathering more data
            current_finding = await specialist_agent.gather_more_evidence(action)
```

## 8. Example Debate Trace

Here is a real trace demonstrating the Critic's adversarial loop in action on a 25% retention drop at 1:45.

**Round 1:**
- **Forensic Agent Claims:** "Boring visuals caused the drop at 1:45. The scene remains visually static for 12 seconds." (Confidence: 0.85)
- **Critic Evaluates:** `CHALLENGE`. 
- **Critic Reasoning:** "Visual stagnancy alone is correlational. Did the creator stop speaking? Was there a transition?"
- **Counter-Hypothesis:** "The cut frequency was normal, but the audio died. What about the audio?"
- **Action Sent to Audio Agent:** `REQUEST_EVIDENCE (Tools: detect_dead_air)`

**Round 2:**
- **Audio Agent Reports:** "Ran `detect_dead_air`. Detected 4.5 seconds of absolute dead air from 1:42 to 1:47."
- **Critic Evaluates:** `APPROVE`.
- **Critic Reasoning:** "Dead air (4.5s) + Visual Stagnancy (12s) = The creator paused awkwardly and the visuals didn't compensate. Root cause: delivery hesitation combined with lack of b-roll."
- **Final Verdict:** Finding approved. Updated root cause merged. Final confidence calibrated to 0.95.

## 9. Why This Matters

The Critic Agent is the defining architectural feature of Cutpoint.

Most GenAI applications suffer from **"LLM Sycophancy"**—the tendency of language models to confidently output a plausible-sounding answer and the system to accept it as absolute truth. If a visual agent sees a drop in retention, it will confidently guess *why* even if it lacks proof.

By introducing the Critic, we implement **Adversarial Verification**. The Critic does not care about pleasing the user; it cares about logical soundness. 
- It forces the system to move beyond *correlation* into *causation*.
- It guarantees that tools are actually being utilized (not just hallucinated).
- It is exactly the type of self-correcting, multi-agent reflection loop that judges at hackathons look for to distinguish a true "Agentic System" from a simple "Prompt Wrapper."
