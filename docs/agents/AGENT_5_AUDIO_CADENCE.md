# Agent 5: Audio & Cadence Agent (The Sound Engineer)

**Status:** Active | **Type:** Specialist Analyst | **Core Domain:** Audio Analysis

## 1. Agent Identity

- **Name:** Audio & Cadence Agent
- **Role:** The Sound Engineer
- **Model:** Google Gemini 3.8 Flash (`gemini-3.8-flash`) for multimodal audio analysis
- **Fallback Models:** Whisper `large-v3` (transcription) + Groq GPT-OSS 120B (analysis and reasoning)

## 2. Purpose

The Audio & Cadence Agent specializes in analyzing the acoustic dimension of viewer drop-offs. While the Multimodal Forensic Agent focuses on visual stimulation and content flow, this agent is an expert in speech patterns, pacing, dead air, audio quality, and the creator's emotional energy. In the Cutpoint system, audio factors are frequently the "hidden cause" of retention cliffs—subtle tonal shifts or pacing lags that visual analysis alone cannot detect.

## 3. Autonomous Behaviors

The Sound Engineer operates autonomously to perform the following deep acoustic forensics:

- **Speech Cadence Analysis:** Continuously monitors words-per-minute (WPM). It detects sudden deceleration in pacing which strongly correlates with viewer disengagement.
- **Dead Air Detection:** Identifies uncomfortable silence gaps or unedited pauses (typically > 2 seconds) that disrupt the engagement flow.
- **Energy Envelope Analysis:** Measures vocal energy, enthusiasm levels, and dynamic range, successfully identifying monotone segments that cause viewer fatigue.
- **Audio Quality Detection:** Listens for jarring audio artifacts—clipping, background noise spikes, plosives, and unexpected volume drops or jumps.
- **Transcript Sentiment Analysis:** Analyzes the semantic and emotional trajectory of speech to identify negative tonal shifts, awkward transitions, or sudden changes in topic that alienate viewers.
- **Dynamic Tool Selection:** Based on the initial hypothesis formed by listening to the cliff context, the agent intelligently selects which audio forensic tools to deploy to prove or disprove its theories.

---

## 4. Tool Definitions (Function Calling)

The Audio & Cadence agent accesses specific audio analysis tools via function calling. Below are the Pydantic representations and JSON schemas for these tools.

### `analyze_speech_cadence(start_sec: float, end_sec: float)`
Measures words-per-minute in the segment vs the video average.

```json
{
  "name": "analyze_speech_cadence",
  "description": "Measures words-per-minute (WPM) in a specific audio segment and compares it to the video average. Identifies pacing drops and monotone delivery.",
  "parameters": {
    "type": "object",
    "properties": {
      "start_sec": {
        "type": "number",
        "description": "Start time in seconds"
      },
      "end_sec": {
        "type": "number",
        "description": "End time in seconds"
      }
    },
    "required": ["start_sec", "end_sec"]
  }
}
```
**Returns:** `segment_wpm` (float), `video_avg_wpm` (float), `cadence_change_pct` (float), `monotone_score` (float 0.0-1.0)

### `detect_dead_air(start_sec: float, end_sec: float, threshold_seconds: float = 2.0)`
Finds silence/pause gaps exceeding the specified threshold.

```json
{
  "name": "detect_dead_air",
  "description": "Identifies periods of silence or unedited pauses exceeding a threshold, which often cause viewer drop-off.",
  "parameters": {
    "type": "object",
    "properties": {
      "start_sec": {
        "type": "number",
        "description": "Start time in seconds"
      },
      "end_sec": {
        "type": "number",
        "description": "End time in seconds"
      },
      "threshold_seconds": {
        "type": "number",
        "description": "Minimum duration of silence in seconds to flag as dead air",
        "default": 2.0
      }
    },
    "required": ["start_sec", "end_sec"]
  }
}
```
**Returns:** `dead_air_segments` (List[Dict] with start, end, duration), `total_dead_air_seconds` (float), `dead_air_percentage` (float)

### `measure_energy_envelope(start_sec: float, end_sec: float)`
Measures vocal energy, enthusiasm, and dynamism.

```json
{
  "name": "measure_energy_envelope",
  "description": "Measures the vocal energy, enthusiasm, and dynamic range in the audio segment. Useful for detecting low-energy delivery or sudden drops in excitement.",
  "parameters": {
    "type": "object",
    "properties": {
      "start_sec": {
        "type": "number",
        "description": "Start time in seconds"
      },
      "end_sec": {
        "type": "number",
        "description": "End time in seconds"
      }
    },
    "required": ["start_sec", "end_sec"]
  }
}
```
**Returns:** `avg_energy` (float), `energy_variance` (float), `energy_trend` (string: "rising", "falling", "flat"), `enthusiasm_score` (float 0.0-1.0)

### `detect_audio_artifacts(start_sec: float, end_sec: float)`
Checks for clipping, pops, background noise, volume jumps.

```json
{
  "name": "detect_audio_artifacts",
  "description": "Scans the audio segment for jarring artifacts such as clipping, background noise spikes, plosives, and inconsistent volume levels.",
  "parameters": {
    "type": "object",
    "properties": {
      "start_sec": {
        "type": "number",
        "description": "Start time in seconds"
      },
      "end_sec": {
        "type": "number",
        "description": "End time in seconds"
      }
    },
    "required": ["start_sec", "end_sec"]
  }
}
```
**Returns:** `artifacts` (List[Dict] with type, timestamp, severity), `overall_quality_score` (float 0.0-1.0)

### `extract_transcript_sentiment(start_sec: float, end_sec: float)`
Extracts speech transcript and analyzes sentiment/topic flow.

```json
{
  "name": "extract_transcript_sentiment",
  "description": "Extracts the spoken transcript for the segment and analyzes the semantic sentiment, topic flow, and identifies jarring topic shifts.",
  "parameters": {
    "type": "object",
    "properties": {
      "start_sec": {
        "type": "number",
        "description": "Start time in seconds"
      },
      "end_sec": {
        "type": "number",
        "description": "End time in seconds"
      }
    },
    "required": ["start_sec", "end_sec"]
  }
}
```
**Returns:** `transcript_text` (string), `sentiment_score` (float -1.0 to 1.0), `topic_keywords` (List[string]), `topic_shift_detected` (bool)

---

## 5. Investigation Protocol

The Audio & Cadence Agent operates under a strict perception-action-reflection loop, analogous to the Forensic Agent but tailored for the auditory realm:

1. **Intake:** Receive cliff data (timestamp, duration, severity) from the Supervisor.
2. **Initial Listening:** Process the raw audio segment (typically cliff - 15s to cliff + 10s).
3. **Hypothesis Generation:** Formulate an initial acoustic hypothesis based on raw listening (e.g., "The creator stopped talking for 4 seconds, causing a dead air drop-off").
4. **Tool Deployment:** Autonomously call specific tools (e.g., `detect_dead_air`, `analyze_speech_cadence`) to gather empirical data proving or disproving the hypothesis.
5. **Evaluation:** Analyze the tool returns. If the dead air tool returns nothing, pivot and check for audio artifacts or energy drops.
6. **Synthesis:** Compile the findings, assign a confidence score, and formulate editing recommendations.
7. **Submission:** Send the structured `AudioAnalysis` finding back to the Supervisor Agent.

---

## 6. System Prompt

```text
You are the Cutpoint Audio & Cadence Agent (The Sound Engineer). Your expertise is in forensic audio analysis to determine why viewers abandon a YouTube video at specific timestamps.

Your job is to analyze the audio dimension of viewer drop-offs (cliffs). While visual elements matter, you know that poor audio pacing, dead air, low vocal energy, and jarring audio artifacts are often the silent killers of viewer retention.

INVESTIGATION PROTOCOL:
1. Listen carefully to the audio context around the provided cliff timestamp.
2. Formulate hypotheses about the cause of the drop-off (e.g., Is there dead air? Did the pacing slow down? Is the speaker monotone? Is there a jarring volume spike?).
3. Use your tools to gather hard data to test your hypotheses.
4. Refine your diagnosis based on the tool results.
5. Produce a final report with high confidence, supported by data, and provide actionable editing advice.

AVAILABLE TOOLS:
- analyze_speech_cadence: Measure WPM and pacing.
- detect_dead_air: Find uncomfortable silences.
- measure_energy_envelope: Analyze vocal enthusiasm and dynamism.
- detect_audio_artifacts: Find clipping, noise, or volume issues.
- extract_transcript_sentiment: Analyze the script for jarring topic shifts.

Be precise, objective, and data-driven. Do not hallucinate audio issues that your tools do not support. If the audio is perfect, report that with high confidence.
```

---

## 7. Data Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CadenceAnalysis(BaseModel):
    segment_wpm: float
    video_avg_wpm: float
    cadence_change_pct: float
    monotone_score: float

class DeadAirReport(BaseModel):
    dead_air_segments: List[Dict[str, float]] # keys: start, end, duration
    total_dead_air_seconds: float
    dead_air_percentage: float

class EnergyAnalysis(BaseModel):
    avg_energy: float
    energy_variance: float
    energy_trend: str # 'rising', 'falling', 'flat'
    enthusiasm_score: float

class AudioQualityReport(BaseModel):
    artifacts: List[Dict[str, Any]] # keys: type, timestamp, severity
    overall_quality_score: float

class AudioAnalysis(BaseModel):
    timestamp_seconds: float
    audio_root_cause: str = Field(description="Primary auditory reason for the cliff")
    cadence_analysis: Optional[CadenceAnalysis] = None
    energy_analysis: Optional[EnergyAnalysis] = None
    dead_air_report: Optional[DeadAirReport] = None
    audio_quality_report: Optional[AudioQualityReport] = None
    transcript_excerpt: Optional[str] = None
    sentiment_score: Optional[float] = None
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in this diagnosis")
    recommendations: List[str] = Field(description="Actionable editing instructions to fix the issue")
```

---

## 8. Complete Implementation

```python
import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Assume Data Models from section 7 are imported here

class AudioCadenceAgent:
    def __init__(self, api_key: str):
        # We use Gemini 3.8 Flash for its multimodal audio processing capabilities
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-3.8-flash'
        self.system_prompt = self._load_system_prompt()
        
    def _load_system_prompt(self) -> str:
        return """You are the Cutpoint Audio & Cadence Agent (The Sound Engineer)... (full prompt from section 6)"""

    async def investigate_cliff(self, video_uri: str, cliff_timestamp: float, context_window: int = 15) -> AudioAnalysis:
        """
        Executes the autonomous perception-action-reflection loop for audio forensics.
        """
        start_sec = max(0, cliff_timestamp - context_window)
        end_sec = cliff_timestamp + 5
        
        logger.info(f"Audio Agent investigating cliff at {cliff_timestamp}s. Window: {start_sec}s - {end_sec}s")
        
        # In a real implementation, we would pass the audio file to Gemini using File API
        # Here we simulate the agent's interaction loop
        
        messages = [
            types.Content(role="user", parts=[
                types.Part.from_text(f"Analyze the audio around the retention cliff at {cliff_timestamp} seconds. "
                                     f"The relevant context window is from {start_sec}s to {end_sec}s. "
                                     f"Formulate a hypothesis and use tools to investigate.")
            ])
        ]
        
        tools = self._get_tools()
        
        # Autonomous Investigation Loop (max 3 iterations)
        for iteration in range(3):
            logger.debug(f"Audio Agent iteration {iteration+1}")
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=messages,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_prompt,
                    tools=tools,
                    temperature=0.2
                )
            )
            
            # Add assistant response to history
            messages.append(response.candidates[0].content)
            
            if response.function_calls:
                # Execute tools
                tool_results = await self._execute_tools(response.function_calls, video_uri)
                
                # Append tool responses back to the conversation
                messages.append(
                    types.Content(role="user", parts=[
                        types.Part.from_function_response(
                            name=call.name,
                            response={"result": result}
                        ) for call, result in tool_results.items()
                    ])
                )
            else:
                # No more function calls, meaning the agent has reached a conclusion
                break
                
        # Final Generation phase: Ask the agent to format its findings into the strictly typed Pydantic schema
        final_prompt = types.Content(role="user", parts=[
            types.Part.from_text("Based on your investigation, provide the final analysis using the AudioAnalysis JSON schema.")
        ])
        messages.append(final_prompt)
        
        final_response = self.client.models.generate_content(
            model=self.model_name,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=self.system_prompt,
                response_mime_type="application/json",
                # Note: In a full implementation we would pass the AudioAnalysis JSON schema here
            )
        )
        
        # Parse output into Pydantic model
        result_json = json.loads(final_response.text)
        analysis = AudioAnalysis(**result_json)
        return analysis

    def _get_tools(self) -> List[Dict]:
        # Returns the tools defined in Section 4 in Gemini format
        # Omitted for brevity in this snippet, but maps directly to the schemas provided above.
        pass

    async def _execute_tools(self, function_calls, video_uri) -> Dict:
        """Mock implementation of the audio analysis tools using numpy/scipy in the background"""
        results = {}
        for call in function_calls:
            logger.info(f"Executing tool: {call.name} with args {call.args}")
            if call.name == "analyze_speech_cadence":
                # Implementation would load audio with librosa/scipy and calculate WPM
                results[call] = {"segment_wpm": 120, "video_avg_wpm": 150, "cadence_change_pct": -20.0, "monotone_score": 0.8}
            elif call.name == "detect_dead_air":
                # Implementation would look for energy < threshold for duration > threshold
                results[call] = {"dead_air_segments": [{"start": call.args['start_sec'], "end": call.args['start_sec']+3, "duration": 3.0}], "total_dead_air_seconds": 3.0, "dead_air_percentage": 15.0}
            elif call.name == "measure_energy_envelope":
                results[call] = {"avg_energy": 0.3, "energy_variance": 0.05, "energy_trend": "flat", "enthusiasm_score": 0.2}
            elif call.name == "detect_audio_artifacts":
                results[call] = {"artifacts": [], "overall_quality_score": 0.9}
            elif call.name == "extract_transcript_sentiment":
                results[call] = {"transcript_text": "So anyway... yeah.", "sentiment_score": -0.2, "topic_keywords": ["unrelated"], "topic_shift_detected": True}
        return results
```

---

## 9. Complementarity with Multimodal Forensic Agent

The Cutpoint architecture relies on distinct specialist agents analyzing different dimensions of the same retention cliff simultaneously. The Audio & Cadence Agent works directly in parallel with the Multimodal Forensic Agent. 

Once both agents complete their investigations, their `AudioAnalysis` and `ForensicAnalysis` objects are passed to the **Supervisor Agent**.

### How findings are merged:

1. **Agreement (High Confidence):**
   If the Forensic Agent detects a static visual frame, and the Audio Agent detects dead air at the exact same timestamp, the Supervisor merges these findings into a unified high-confidence root cause (e.g., "Complete pacing halt: Dead air combined with visual stagnancy").
   
2. **Disagreement (Conflict Resolution):**
   If the Forensic Agent says the editing is fast-paced and excellent, but the Audio Agent flags severe audio clipping and a negative tonal shift, the findings conflict regarding the overall quality of the segment. The Supervisor invokes the **Retention Critic Agent** to debate the findings. Usually, the Critic recognizes that bad audio overrides good visuals, weighting the Audio Agent's findings higher for that specific cliff.

3. **Orthogonal Findings:**
   Often, one agent finds nothing wrong (e.g., visuals are fine), but the other finds a severe issue (e.g., a massive drop in speech WPM). The Supervisor accepts the finding of the agent that discovered an anomaly, establishing that the cliff was caused purely by auditory factors, demonstrating the necessity of specialized multi-agent architectures.

---
*Generated by AI Content Engine Architecture Team*
