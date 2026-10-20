import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General
    PROJECT_NAME: str = "Sistema de Gestión de Cursos Preparatorios - Maestría"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & JWT
    SECRET_KEY: str = "super-secret-key-change-this-in-production-use-strong-hash"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database (AWS RDS PostgreSQL or SQLite fallback)
    DATABASE_URL: str = "sqlite:///./master_preparatory.db"

    # Storage (AWS S3 or Local)
    STORAGE_BACKEND: str = "local"  # "local" | "s3"
    LOCAL_UPLOAD_DIR: str = "./uploads"

    # AWS Credentials & Config
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET_NAME: str = "master-preparatory-evidences-bucket"

    # Notification & SMTP
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "email-smtp.us-east-1.amazonaws.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "notificaciones@universidad-maestrias.edu"
    EMAILS_FROM_NAME: str = "Coordinación de Maestrías"

settings = Settings()
