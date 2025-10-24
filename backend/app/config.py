"""
Configuration settings for the PolicyPal FastAPI backend.
Handles environment variables and application settings.
"""

import os
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://user:password@localhost/policypal"
    
    # LLM Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY")
    groq_api_key: str = os.getenv("GROQ_API_KEY")
    llm_provider: Literal["openai", "groq"] = "openai"
    llm_model: str = "gpt-4o-mini"  # Default to cost-effective model
    
    # API Configuration
    api_title: str = "PolicyPal API"
    api_description: str = "AI-powered policy summarization and comparison"
    api_version: str = "1.0.0"
    
    # CORS Settings
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]
    
    # File Upload Settings
    max_file_size: int = 25 * 1024 * 1024  # 25MB
    allowed_file_types: list[str] = ["application/pdf"]
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600  # 1 hour
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = Path(__file__).resolve().parents[2] / ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
