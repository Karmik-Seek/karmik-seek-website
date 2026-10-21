from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kaarmik Seek API"
    ENV: str = os.getenv("ENV", "development")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/karmik_seek")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "karmik_seek")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "karmik-seek")
    FIREBASE_CREDENTIALS_JSON: Optional[str] = os.getenv("FIREBASE_CREDENTIALS_JSON", None)
    ADMIN_EMAILS: List[str] = ["prajwalganiga06@gmail.com", "testathri@gmail.com"]
    ADMIN_DEFAULT_PASSWORD: str = os.getenv("ADMIN_DEFAULT_PASSWORD", "")
    ADMIN_CREDENTIALS: dict = {
        "prajwalganiga06@gmail.com": os.getenv("ADMIN_DEFAULT_PASSWORD", ""),
        "testathri@gmail.com": os.getenv("ADMIN_ATHRI_PASSWORD", "athri262")
    }
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "UhuRZHkR92VbsJiSqWALKZ_xPvB736YdjgwoIIxO0W2GAGYWHFJrFUZiHrwZTgQG")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://kaarmikseek.vercel.app")
    
    # SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Kaarmik Seek")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "true").lower() in ("true", "1", "yes")

    # Cloudinary Configuration
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "cloudinary://933389253512158:j0WiKuAju2PtSqRd8NT6X9wy6zc@xs5zymdc")
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "xs5zymdc")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "933389253512158")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "j0WiKuAju2PtSqRd8NT6X9wy6zc")

    CORS_ORIGINS: List[str] = [
        "https://kaarmikseek.vercel.app",
        "https://karmik-seek-website.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @property
    def admin_emails_set(self) -> set:
        return {e.strip().lower() for e in self.ADMIN_EMAILS if e.strip()}

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
