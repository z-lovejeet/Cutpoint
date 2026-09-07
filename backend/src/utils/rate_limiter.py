"""
Rate limiting utilities for external API calls.
Implements asyncio semaphores and a rolling daily quota limiter
(strictly capped at 18 requests per day for Gemini free tier).
"""
import asyncio
import json
import logging
import time
from functools import wraps
from pathlib import Path
from typing import Any, Callable, List

logger = logging.getLogger(__name__)

class LoopBoundSemaphore:
    """A thread-safe, loop-safe semaphore that instantiates a semaphore per event loop."""

    def __init__(self, value: int):
        self._value = value
        self._semaphores: dict[int, asyncio.Semaphore] = {}

    def get_semaphore(self) -> asyncio.Semaphore:
        try:
            loop = asyncio.get_running_loop()
            loop_id = id(loop)
            if loop_id not in self._semaphores:
                self._semaphores[loop_id] = asyncio.Semaphore(self._value)
            return self._semaphores[loop_id]
        except RuntimeError:
            return asyncio.Semaphore(self._value)

    async def __aenter__(self):
        return await self.get_semaphore().__aenter__()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return await self.get_semaphore().__aexit__(exc_type, exc_val, exc_tb)


# Global concurrency semaphores
gemini_semaphore = LoopBoundSemaphore(5)    # 5 concurrent requests
groq_semaphore = LoopBoundSemaphore(20)     # 20 concurrent requests
youtube_semaphore = LoopBoundSemaphore(5)   # 5 concurrent requests


class GeminiQuotaExceededError(Exception):
    """Raised when Gemini daily request limit (18 RPD) is reached."""
    pass


class GeminiDailyRateLimiter:
    """
    Tracks and enforces a strict daily request quota for Google Gemini.
    Default limit is 18 requests per day (RPD) to safely stay under Google's 20 RPD cap.
    Persists timestamps to disk so restarts preserve the quota budget.
    """

    def __init__(self, max_rpd: int = 18, state_file: str = ".gemini_usage.json"):
        self.max_rpd = max_rpd
        self.state_file = Path(state_file)
        self._locks: dict[int, asyncio.Lock] = {}

    @property
    def lock(self) -> asyncio.Lock:
        try:
            loop = asyncio.get_running_loop()
            loop_id = id(loop)
            if loop_id not in self._locks:
                self._locks[loop_id] = asyncio.Lock()
            return self._locks[loop_id]
        except RuntimeError:
            return asyncio.Lock()

    def _load_timestamps(self) -> List[float]:
        if not self.state_file.exists():
            return []
        try:
            with open(self.state_file, "r") as f:
                data = json.load(f)
                return data.get("timestamps", [])
        except Exception as e:
            logger.warning("Could not read Gemini rate limit state: %s", e)
            return []

    def _save_timestamps(self, timestamps: List[float]):
        try:
            with open(self.state_file, "w") as f:
                json.dump({"timestamps": timestamps, "updated_at": time.time()}, f)
        except Exception as e:
            logger.warning("Could not persist Gemini rate limit state: %s", e)

    def _cleanup_old_timestamps(self, timestamps: List[float]) -> List[float]:
        cutoff = time.time() - 86400  # 24 hours ago
        return [ts for ts in timestamps if ts > cutoff]

    async def can_request(self) -> bool:
        """Returns True if the daily quota is not exhausted."""
        async with self.lock:
            timestamps = self._cleanup_old_timestamps(self._load_timestamps())
            return len(timestamps) < self.max_rpd

    async def record_request(self):
        """Records a successful or initiated Gemini API request."""
        async with self.lock:
            timestamps = self._cleanup_old_timestamps(self._load_timestamps())
            timestamps.append(time.time())
            self._save_timestamps(timestamps)
            logger.info("Gemini request recorded. Usage today: %d/%d RPD", len(timestamps), self.max_rpd)

    async def remaining(self) -> int:
        """Returns remaining requests allowed for today."""
        async with self.lock:
            timestamps = self._cleanup_old_timestamps(self._load_timestamps())
            return max(0, self.max_rpd - len(timestamps))


# Singleton instance configured to 450 RPD (leaving headroom under Gemini 3.5 Flash Lite 500 RPD quota)
gemini_daily_limiter = GeminiDailyRateLimiter(max_rpd=450)


def with_semaphore(semaphore: Any):
    """Decorator to rate-limit async functions with a designated semaphore."""
    def decorator(func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            async with semaphore:
                return await func(*args, **kwargs)
        return wrapper
    return decorator
