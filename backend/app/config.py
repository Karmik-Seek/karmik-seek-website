from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kaarmik Seek API"
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/karmik_seek")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "karmik_seek")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "karmik-seek")
    ADMIN_EMAILS: List[str] = ["prajwalganiga06@gmail.com", "testathri@gmail.com"]
    ADMIN_DEFAULT_PASSWORD: str = os.getenv("ADMIN_DEFAULT_PASSWORD", "")
    ADMIN_CREDENTIALS: dict = {
        "prajwalganiga06@gmail.com": os.getenv("ADMIN_DEFAULT_PASSWORD", ""),
        "testathri@gmail.com": os.getenv("ADMIN_ATHRI_PASSWORD", "athri262")
    }
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "resumes")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Kaarmik Seek")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "true").lower() in ("true", "1", "yes")

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
