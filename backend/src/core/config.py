from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "Cutpoint API"
    VERSION: str = "0.1.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Supabase Auth & DB
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DATABASE_URL: str = ""

    # Google Cloud & YouTube
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback"
    YOUTUBE_API_KEY: str = ""

    # AI Models
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_FALLBACK_MODEL: str = "gemini-3.5-flash"
    GEMINI_MAX_RPD: int = 450
    GROQ_API_KEY: str = ""
    GROQ_REPORT_MODEL: str = "openai/gpt-oss-20b"
    GROQ_CHAT_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FALLBACK_MODEL: str = "groq/compound-mini"

    # Security
    SECRET_KEY: str = "cutpoint-super-secret-development-key-32-chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    @property
    def cors_origins(self) -> List[str]:
        origins = [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
        if self.FRONTEND_URL:
            clean_frontend = self.FRONTEND_URL.rstrip("/")
            if clean_frontend not in origins:
                origins.append(clean_frontend)
        return origins


settings = Settings()
