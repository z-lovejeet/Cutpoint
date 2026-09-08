"""
Unit tests for the Google Gemini cascading fallback mechanism:
gemini-3.8-flash -> gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash -> gemini-3.5-flash-lite.
"""
from unittest.mock import MagicMock, patch
import pytest
from google.genai import errors

from src.core.config import settings
from src.services.gemini_service import GeminiService
from src.utils.rate_limiter import GeminiQuotaExceededError


@pytest.mark.asyncio
async def test_gemini_model_chain_configuration():
    """Verifies default and customized fallback chain resolution."""
    # Custom chain (e.g., local server testing with 3.5-flash-lite only)
    with patch.object(settings, "GEMINI_FALLBACK_CHAIN", "gemini-3.5-flash-lite"):
        assert settings.gemini_model_chain == ["gemini-3.5-flash-lite"]
        svc = GeminiService()
        assert svc.model_chain == ["gemini-3.5-flash-lite"]
        assert svc.model_name == "gemini-3.5-flash-lite"

    # Default production chain
    with patch.object(settings, "GEMINI_FALLBACK_CHAIN", None):
        expected_chain = [
            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
        ]
        assert settings.gemini_model_chain == expected_chain
        svc = GeminiService()
        assert svc.model_chain == expected_chain
        assert svc.model_name == "gemini-3.8-flash"


@pytest.mark.asyncio
async def test_gemini_generate_text_fallback_on_model_failure():
    """Verifies generate_text falls back from failing model to subsequent model."""
    svc = GeminiService()
    mock_client = MagicMock()
    svc._client = mock_client

    call_history = []

    def mock_generate_content(model, contents, config):
        call_history.append(model)
        if model == "gemini-3.8-flash":
            # Simulate 429 quota exhaustion
            raise errors.APIError(429, {"error": {"message": "Quota exhausted for gemini-3.8-flash"}})
        mock_resp = MagicMock()
        mock_resp.text = f"Response from {model}"
        return mock_resp

    mock_client.models.generate_content.side_effect = mock_generate_content

    with patch.object(settings, "GEMINI_FALLBACK_CHAIN", "gemini-3.8-flash,gemini-3.7-flash"):
        res = await svc.generate_text("test prompt")

        assert "gemini-3.8-flash" in call_history
        assert "gemini-3.7-flash" in call_history
        assert res == "Response from gemini-3.7-flash"


@pytest.mark.asyncio
async def test_gemini_analyze_with_tools_fallback_on_model_failure():
    """Verifies analyze_with_tools cascades to next model when chat creation / execution fails."""
    svc = GeminiService()
    mock_client = MagicMock()
    svc._client = mock_client

    created_models = []

    def mock_create_chat(model, config):
        created_models.append(model)
        if model == "gemini-3.8-flash":
            raise errors.APIError(429, {"error": {"message": "Quota exhausted for gemini-3.8-flash"}})

        mock_chat = MagicMock()
        mock_response = MagicMock()
        mock_response.function_calls = None
        mock_response.text = '{"root_cause": "Visual drop", "confidence": 0.9}'
        mock_chat.send_message.return_value = mock_response
        return mock_chat

    mock_client.chats.create.side_effect = mock_create_chat

    def dummy_tool():
        return {}

    with patch.object(settings, "GEMINI_FALLBACK_CHAIN", "gemini-3.8-flash,gemini-3.5-flash-lite"):
        result = await svc.analyze_with_tools(
            prompt="test prompt",
            system_instruction="sys",
            tools=[dummy_tool],
        )

        assert created_models == ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
        assert result["model_used"] == "gemini-3.5-flash-lite"
        assert result["parsed_json"]["root_cause"] == "Visual drop"


@pytest.mark.asyncio
async def test_gemini_all_models_fail_raises_quota_error():
    """Verifies that when all fallback models fail with 429, GeminiQuotaExceededError is raised."""
    svc = GeminiService()
    mock_client = MagicMock()
    svc._client = mock_client
    mock_client.models.generate_content.side_effect = errors.APIError(
        429, {"error": {"message": "Quota exceeded"}}
    )

    with patch.object(settings, "GEMINI_FALLBACK_CHAIN", "gemini-3.8-flash,gemini-3.7-flash"):
        with pytest.raises(GeminiQuotaExceededError):
            await svc.generate_text("test")
