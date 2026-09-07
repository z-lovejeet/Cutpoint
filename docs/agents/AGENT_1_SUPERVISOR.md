# Agent 1: The Supervisor Agent (Lead Investigator)

## 1. Agent Identity
- **Name:** Supervisor Agent
- **Role:** Lead Investigator / Orchestrator
- **Model:** Groq GPT-OSS 120B (`openai/gpt-oss-120b`)
- **Fallback:** `groq/compound`

## 2. Purpose & Philosophy

The Supervisor is NOT a dumb sequential orchestrator. It is a genuine autonomous agent that implements a dynamic perception-action-reflection loop.

Its primary responsibilities are:
- **Goal Reception:** Receives a high-level goal (e.g., 'Investigate why viewers are leaving this video').
- **Dynamic Planning:** Formulates an investigation plan based on initial data characteristics (like cliff density, severity, video length).
- **Specialist Dispatch:** Dispatches specialist agents (Forensic, Audio, Critic) with specific sub-tasks.
- **Monitoring & Re-evaluation:** Monitors progress and intermediate results.
- **Conflict Resolution:** Mediates when Forensic and Audio agents disagree, or when the Critic challenges a finding.
- **Confidence Assessment:** Determines confidence levels and requests re-investigation when evidence is weak.
- **Quality Assurance:** Makes the final call on report quality before triggering publication.

## 3. Investigation Planning (Dynamic)

The Supervisor creates an `InvestigationPlan` based on:
- **Number of cliffs detected:** Few (deep dive) vs Many (prioritize top severe cliffs).
- **Severity distribution:** All HIGH severity vs mixed.
- **Video length:** Short-form (high-density parallel analysis) vs Long-form (batch processing, sequential passes).
- **Available resources:** API quotas, time budget.

### System Prompt
```markdown
You are the Supervisor Agent, the Lead Investigator of the Cutpoint platform.
Your job is to orchestrate a multi-agent investigation into YouTube viewer retention drops (cliffs).
You are not a simple router. You must act as a lead detective: formulate hypotheses, assign specialists, evaluate their findings, and ensure high confidence before publishing a report.

When given raw cliff data, first formulate an InvestigationPlan using the `formulate_plan` tool.
Consider:
- Are there too many cliffs? Prioritize by severity.
- Is the video short or long?
- Which specialists are needed first?

When agents return findings, evaluate them. If evidence is weak or contradictory, use `request_critic_review` or `request_reinvestigation`.
When you have high confidence verified findings, use `compile_report`.
```

### Plan Schema
```python
from pydantic import BaseModel
from typing import List, Literal

class Phase(BaseModel):
    phase_name: str
    target_cliffs: List[str]
    assigned_agents: List[Literal["forensic", "audio", "critic"]]
    strategy: Literal["parallel", "sequential"]

class InvestigationPlan(BaseModel):
    video_id: str
    total_cliffs: int
    phases: List[Phase]
    resource_budget: str
    rationale: str
```

## 4. Tool Definitions

The Supervisor has the following callable tools.

```json
[
  {
    "type": "function",
    "function": {
      "name": "dispatch_forensic_analysis",
      "description": "Sends a cliff to the Visual Detective for multimodal analysis.",
      "parameters": {
        "type": "object",
        "properties": {
          "cliff_id": { "type": "string" },
          "priority": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] }
        },
        "required": ["cliff_id", "priority"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "dispatch_audio_analysis",
      "description": "Sends a cliff to the Sound Engineer for audio and cadence analysis.",
      "parameters": {
        "type": "object",
        "properties": {
          "cliff_id": { "type": "string" },
          "priority": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] }
        },
        "required": ["cliff_id", "priority"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "request_critic_review",
      "description": "Asks the Skeptic to challenge a finding.",
      "parameters": {
        "type": "object",
        "properties": {
          "cliff_id": { "type": "string" },
          "hypothesis": { "type": "string" }
        },
        "required": ["cliff_id", "hypothesis"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "request_reinvestigation",
      "description": "Forces an agent to re-analyze based on a specific reason.",
      "parameters": {
        "type": "object",
        "properties": {
          "cliff_id": { "type": "string" },
          "agent": { "type": "string", "enum": ["forensic", "audio"] },
          "reason": { "type": "string" }
        },
        "required": ["cliff_id", "agent", "reason"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "compile_report",
      "description": "Triggers the Report Synthesizer with verified findings.",
      "parameters": {
        "type": "object",
        "properties": {
          "verified_findings": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["verified_findings"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "update_investigation_status",
      "description": "Updates shared state about the investigation.",
      "parameters": {
        "type": "object",
        "properties": {
          "phase": { "type": "string" },
          "details": { "type": "string" }
        },
        "required": ["phase", "details"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "assess_confidence",
      "description": "Evaluates evidence strength for a set of findings.",
      "parameters": {
        "type": "object",
        "properties": {
          "findings": { "type": "string" }
        },
        "required": ["findings"]
      }
    }
  }
]
```

## 5. Decision Making Logic

- **Parallel vs Sequential:** Run Forensic and Audio in parallel for short-form content or when API limits allow. Use sequential if one relies on the output of the other (e.g., Audio finds dead air, Supervisor asks Forensic to check if visually something was happening).
- **Skipping the Critic:** If Forensic and Audio independently arrive at the exact same conclusion (e.g., both say "boring segment") with HIGH confidence, the Critic can be skipped.
- **Re-investigation:** If Critic lowers confidence below 0.7, Supervisor triggers a re-investigation with specific new hypotheses.
- **Conflict Resolution:** If Forensic claims "boring visuals" but Audio claims "audio glitch", Supervisor assesses confidence scores. If tied, it requests a detailed timeline overlap from both, or requests Critic intervention to arbitrate based on historical patterns.

## 6. Complete Implementation

```python
import os
import json
import asyncio
from typing import List, Dict, Any
from groq import AsyncGroq
from pydantic import BaseModel

class SupervisorAgent:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-120b"
        self.state = {}

    async def plan_investigation(self, video_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Create an investigation plan for video {video_data['video_id']} with {len(video_data['cliffs'])} cliffs."
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are the Supervisor Agent..."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        plan = json.loads(response.choices[0].message.content)
        self.state['plan'] = plan
        return plan

    async def dispatch_agents(self, phase: Dict[str, Any]):
        tasks = []
        for cliff_id in phase['target_cliffs']:
            if "forensic" in phase['assigned_agents']:
                tasks.append(self._call_tool("dispatch_forensic_analysis", {"cliff_id": cliff_id, "priority": "HIGH"}))
            if "audio" in phase['assigned_agents']:
                tasks.append(self._call_tool("dispatch_audio_analysis", {"cliff_id": cliff_id, "priority": "HIGH"}))
        
        if phase['strategy'] == 'parallel':
            await asyncio.gather(*tasks)
        else:
            for task in tasks:
                await task

    async def monitor_progress(self):
        # Implementation for monitoring async tasks and updating state
        await self._call_tool("update_investigation_status", {"phase": "monitoring", "details": "Monitoring agent progress..."})

    async def resolve_conflicts(self, findings: List[Dict[str, Any]]):
        # Implementation for evaluating contradictions and using Critic
        pass

    async def finalize_report(self, verified_findings: List[Dict[str, Any]]):
        await self._call_tool("compile_report", {"verified_findings": [f['id'] for f in verified_findings]})

    async def _call_tool(self, tool_name: str, kwargs: Dict[str, Any]):
        # Mocking tool execution
        print(f"[Tool Call] {tool_name}({kwargs})")
        await asyncio.sleep(0.1)

# Example Usage
async def main():
    agent = SupervisorAgent()
    plan = await agent.plan_investigation({"video_id": "vid123", "cliffs": [{"id": "c1", "severity": "HIGH"}]})
    await agent.dispatch_agents(plan['phases'][0])
```

## 7. State Management

The `AnalysisState` object is shared across the investigation:
- **Phase Updates:** Updated dynamically via `update_investigation_status`.
- **Error Recovery:** If an agent fails (e.g., rate limit), Supervisor catches the exception, updates state to `AGENT_FAILED`, and re-queues with exponential backoff or falls back to a cheaper model.
- **Timeouts:** Bounded async calls (e.g., `asyncio.wait_for`). If a task exceeds its budget, it is cancelled and marked as `INCOMPLETE`, and Supervisor moves on to the next highest priority cliff.

## 8. Example Investigation Trace

**Scenario:** 10-minute gaming tutorial with 3 cliffs.

1. **Goal Reception:** `Investigate vid_XYZ`
2. **Planning:**
   - *State Update:* Phase: Planning
   - *Action:* Formulate plan. Output: 3 cliffs. Strategy: Parallel dispatch for Top 2 HIGH cliffs.
3. **Dispatch:**
   - *Tool Call:* `dispatch_forensic_analysis(c1, HIGH)`
   - *Tool Call:* `dispatch_audio_analysis(c1, HIGH)`
4. **Intermediate Evaluation:**
   - Forensic returns: "Visually static scoreboard screen".
   - Audio returns: "Silence for 5 seconds".
   - *Action:* `assess_confidence({"c1": "scoreboard + silence"})` -> Confidence: 0.9.
5. **Conflict (Cliff 2):**
   - Forensic returns: "High action gameplay".
   - Audio returns: "Audio desync detected".
   - *Tool Call:* `request_critic_review(c2, "Audio desync during high action")`
6. **Synthesis:**
   - Critic confirms audio desync.
   - *Tool Call:* `compile_report(["c1_finding", "c2_finding"])`
7. **Complete:** State updated to `REPORT_READY`.
