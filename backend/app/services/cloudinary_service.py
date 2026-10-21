import io
import time
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import HTTPException
from app.config import settings

# Initialize Cloudinary configuration
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB

MAGIC_BYTES = {
    b"%PDF-": ("application/pdf", "pdf"),
    b"PK\x03\x04": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"),
    b"\xd0\xcf\x11\xe0": ("application/msword", "doc"),
}

def validate_resume_file(file_bytes: bytes):
    if len(file_bytes) > MAX_RESUME_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 5 MB.")
    
    for sig, (ctype, ext) in MAGIC_BYTES.items():
        if file_bytes.startswith(sig):
            return ctype, ext
            
    raise HTTPException(status_code=400, detail="Only PDF, DOCX, and DOC documents are allowed.")

def upload_resume_to_cloudinary(file_bytes: bytes, user_id: str, original_filename: str):
    ctype, ext = validate_resume_file(file_bytes)
    safe_uid = str(user_id).replace("@", "_").replace(".", "_")
    public_id = f"resumes/{safe_uid}/{uuid.uuid4().hex}.{ext}"
    
    result = cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        resource_type="raw",
        type="authenticated",
        public_id=public_id,
    )
    
    return {
        "public_id": result["public_id"],
        "ext": ext,
        "size": result.get("bytes", len(file_bytes)),
        "content_type": ctype,
        "original_name": original_filename,
    }

def delete_resume_from_cloudinary(public_id: str):
    if not public_id:
        return
    try:
        cloudinary.uploader.destroy(
            public_id,
            resource_type="raw",
            type="authenticated",
            invalidate=True
        )
    except Exception as e:
        print(f"[WARN] Failed to delete old resume {public_id}: {e}")

def generate_signed_resume_url(public_id: str, ttl_seconds: int = 300) -> str:
    if not public_id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    expires_at = int(time.time()) + ttl_seconds
    url = cloudinary.utils.private_download_url(
        public_id,
        "",
        resource_type="raw",
        type="authenticated",
        expires_at=expires_at,
    )
    return url
