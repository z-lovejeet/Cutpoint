"""
Groq API service client using AsyncGroq SDK.
Handles high-throughput reasoning, structured JSON generation,
function calling, and token streaming for Agents 1, 6, 7, and 8.
"""
import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from groq import AsyncGroq, RateLimitError

from src.core.config import settings
from src.utils.rate_limiter import groq_semaphore, with_semaphore

logger = logging.getLogger(__name__)


class GroqService:
    """Async client for Groq LPU inference with rate limit fallback."""

    def __init__(self):
        self._client: Optional[AsyncGroq] = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            api_key = settings.GROQ_API_KEY
            if not api_key:
                logger.warning("GROQ_API_KEY is not set. Groq calls will fail unless configured.")
            self._client = AsyncGroq(api_key=api_key)
        return self._client

    @with_semaphore(groq_semaphore)
    async def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        response_format: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Executes an asynchronous chat completion on Groq with fallback routing on 429.
        """
        target_model = model or settings.GROQ_CHAT_MODEL
        kwargs: Dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            kwargs["tools"] = tools
        if response_format:
            kwargs["response_format"] = response_format

        try:
            response = await self.client.chat.completions.create(**kwargs)
        except RateLimitError:
            logger.warning("Groq rate limit encountered on model %s. Switching to fallback %s...", target_model, settings.GROQ_FALLBACK_MODEL)
            kwargs["model"] = settings.GROQ_FALLBACK_MODEL
            response = await self.client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        message = choice.message

        tool_calls = []
        if message.tool_calls:
            for tc in message.tool_calls:
                call_args = {}
                try:
                    call_args = json.loads(tc.function.arguments)
                except Exception:
                    pass
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": call_args,
                })

        return {
            "content": message.content or "",
            "role": message.role,
            "tool_calls": tool_calls,
            "finish_reason": choice.finish_reason,
            "model_used": response.model,
        }

    @with_semaphore(groq_semaphore)
    async def chat_completion_stream(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens asynchronously from Groq for interactive chat.
        """
        target_model = model or settings.GROQ_CHAT_MODEL
        try:
            stream = await self.client.chat.completions.create(
                model=target_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except RateLimitError:
            logger.warning("Rate limit hit during streaming on %s. Retrying with fallback %s...", target_model, settings.GROQ_FALLBACK_MODEL)
            stream = await self.client.chat.completions.create(
                model=settings.GROQ_FALLBACK_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content


groq_service = GroqService()
