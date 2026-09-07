"""
Google Gemini service client using google-genai SDK.
Handles multimodal analysis and function calling loops for
Agent 4 (Multimodal Forensic) and Agent 5 (Audio & Cadence),
with strict 18 RPD quota gating and Groq fallback readiness.
"""
import asyncio
import json
import logging
from typing import Any, Callable, Dict, List, Optional

from google import genai
from google.genai import errors, types

from src.core.config import settings
from src.utils.rate_limiter import (
    GeminiQuotaExceededError,
    gemini_daily_limiter,
    gemini_semaphore,
    with_semaphore,
)

logger = logging.getLogger(__name__)


class GeminiService:
    """Async wrapper for Google Gemini Flash models with native tool calling."""

    def __init__(self, model_name: Optional[str] = None):
        self._custom_model_name = model_name
        self._client: Optional[genai.Client] = None

    @property
    def model_name(self) -> str:
        return self._custom_model_name or getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                logger.warning("GEMINI_API_KEY is not set. Gemini calls will fail unless configured.")
            self._client = genai.Client(api_key=api_key)
        return self._client

    @with_semaphore(gemini_semaphore)
    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3,
    ) -> str:
        """Simple text generation using Gemini with 18 RPD quota check."""
        if not await gemini_daily_limiter.can_request():
            remaining = await gemini_daily_limiter.remaining()
            logger.warning("Gemini 18 RPD daily limit reached (%d remaining). Request redirected to fallback.", remaining)
            raise GeminiQuotaExceededError("Gemini daily limit of 18 requests/day reached.")

        config = types.GenerateContentConfig(
            temperature=temperature,
            system_instruction=system_instruction,
        )
        loop = asyncio.get_running_loop()
        try:
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                ),
            )
            await gemini_daily_limiter.record_request()
            return response.text or ""
        except errors.APIError as e:
            if e.code == 429:
                raise GeminiQuotaExceededError(f"Gemini quota exhausted: {e}")
            raise

    @with_semaphore(gemini_semaphore)
    async def analyze_with_tools(
        self,
        prompt: str,
        system_instruction: str,
        tools: List[Callable[..., Any]],
        temperature: float = 0.3,
        max_turns: int = 5,
    ) -> Dict[str, Any]:
        """
        Executes a multi-turn Perception-Action-Reflection conversation with Gemini
        where Gemini can invoke the provided Python functions as tools.
        Enforces strict 18 RPD daily quota limit.
        """
        if not await gemini_daily_limiter.can_request():
            remaining = await gemini_daily_limiter.remaining()
            logger.warning("Gemini 18 RPD daily limit reached (%d remaining). Gating to Groq fallback.", remaining)
            raise GeminiQuotaExceededError("Gemini daily limit of 18 requests/day reached.")

        config = types.GenerateContentConfig(
            temperature=temperature,
            system_instruction=system_instruction,
            tools=tools,
        )

        tool_map = {func.__name__: func for func in tools}
        tools_executed: List[Dict[str, Any]] = []

        loop = asyncio.get_running_loop()

        try:
            chat = self.client.chats.create(
                model=self.model_name,
                config=config,
            )

            current_message: Any = prompt
            final_text = ""

            for _turn in range(max_turns):
                response = await loop.run_in_executor(
                    None,
                    lambda msg=current_message: chat.send_message(msg),
                )

                # Check for function calls
                function_calls = response.function_calls
                if not function_calls:
                    final_text = response.text or ""
                    break

                # Execute tool calls locally
                tool_responses = []
                for call in function_calls:
                    func_name = call.name
                    func_args = dict(call.args) if call.args else {}
                    logger.info("Gemini invoking tool '%s' with args: %s", func_name, func_args)

                    if func_name in tool_map:
                        try:
                            result = tool_map[func_name](**func_args)
                        except Exception as e:
                            logger.error("Error executing tool %s: %s", func_name, e)
                            result = {"error": str(e)}
                    else:
                        result = {"error": f"Unknown tool: {func_name}"}

                    tools_executed.append({
                        "tool": func_name,
                        "args": func_args,
                        "result": result,
                    })

                    tool_responses.append(
                        types.Part.from_function_response(
                            name=func_name,
                            response={"result": result},
                        )
                    )

                current_message = tool_responses

            await gemini_daily_limiter.record_request()

        except errors.APIError as e:
            if e.code == 429:
                raise GeminiQuotaExceededError(f"Gemini quota exhausted: {e}")
            raise

        # Attempt to parse final_text as JSON if applicable
        parsed_json = None
        if final_text:
            clean_text = final_text.strip()
            if clean_text.startswith("```"):
                lines = clean_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_text = "\n".join(lines).strip()

            try:
                parsed_json = json.loads(clean_text)
            except Exception:
                parsed_json = None

        return {
            "text": final_text,
            "parsed_json": parsed_json,
            "tools_executed": tools_executed,
        }


gemini_service = GeminiService()
