from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""

    # API Configuration
    API_PORT: int = Field(default=5000, env="API_PORT")
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_ENV: str = Field(default="development", env="API_ENV")
    API_KEY: str = Field(default="", env="API_KEY")

    # Database
    DATABASE_URL: str = Field(default="", env="DATABASE_URL")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")

    # OpenAI
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-4-turbo-preview", env="OPENAI_MODEL")

    # Anthropic
    ANTHROPIC_API_KEY: str = Field(default="", env="ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = Field(
        default="claude-3-opus-20240229", env="ANTHROPIC_MODEL"
    )

    # AWS S3
    AWS_ACCESS_KEY_ID: str = Field(default="", env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", env="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    S3_BUCKET: str = Field(default="trust-label-ai", env="S3_BUCKET")

    # Security
    JWT_SECRET: str = Field(default="", env="JWT_SECRET")

    # OCR
    TESSERACT_PATH: str = Field(default="/usr/bin/tesseract", env="TESSERACT_PATH")

    # Vector Database
    CHROMA_PERSIST_DIRECTORY: str = Field(
        default="./chroma_db", env="CHROMA_PERSIST_DIRECTORY"
    )

    # Model Configuration
    EMBEDDING_MODEL: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2", env="EMBEDDING_MODEL"
    )
    MAX_TOKENS: int = Field(default=4000, env="MAX_TOKENS")
    TEMPERATURE: float = Field(default=0.3, env="TEMPERATURE")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()