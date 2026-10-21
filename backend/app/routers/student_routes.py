import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from fastapi.responses import RedirectResponse
from app.models.schemas import StudentProfileModel
from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.config import settings
from app.limiter import limiter
from app.services.cloudinary_service import (
    upload_resume_to_cloudinary,
    delete_resume_from_cloudinary,
    generate_signed_resume_url,
    MAX_RESUME_SIZE
)

router = APIRouter(prefix="/api/student", tags=["student"])

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    email = current_user["email"]
    profile = db.student_profiles.find_one({"email": email})
    
    if not profile:
        now = datetime.datetime.now(datetime.timezone.utc)
        new_prof = {
            "user_id": str(current_user["_id"]),
            "email": email,
            "full_name": current_user.get("full_name", ""),
            "phone": "",
            "location": "",
            "experience": "",
            "skills": [],
            "interests": [],
            "availability": [],
            "preferred_job_types": [],
            "education": [],
            "resume": None,
            "resume_url": None,
            "resume_name": None,
            "created_at": now,
            "updated_at": now
        }
        res = db.student_profiles.insert_one(new_prof)
        profile = db.student_profiles.find_one({"_id": res.inserted_id})

    profile["_id"] = str(profile["_id"])
    return profile

@router.put("/profile")
def update_profile(data: StudentProfileModel, current_user: dict = Depends(get_current_user)):
    db = get_db()
    email = current_user["email"]
    now = datetime.datetime.now(datetime.timezone.utc)

    update_fields = {
        "full_name": data.full_name,
        "phone": data.phone,
        "location": data.location,
        "experience": data.experience,
        "skills": data.skills,
        "interests": data.interests,
        "availability": data.availability,
        "preferred_job_types": data.preferred_job_types,
        "education": [e.dict() for e in data.education],
        "updated_at": now
    }

    # Also update full_name on users collection
    if data.full_name:
        db.users.update_one({"email": email}, {"$set": {"full_name": data.full_name, "updated_at": now}})

    db.student_profiles.update_one(
        {"email": email},
        {"$set": update_fields},
        upsert=True
    )

    updated = db.student_profiles.find_one({"email": email})
    updated["_id"] = str(updated["_id"])
    return updated

@router.post("/resume")
@limiter.limit("5/minute")
def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Validates file size (max 5 MB) and magic bytes, uploads to Cloudinary as an
    authenticated raw asset, deletes any previous resume, and updates the profile.
    """
    filename = file.filename or "resume.pdf"
    
    # Read with hard byte cap to prevent memory exhaustion
    file_bytes = file.file.read(MAX_RESUME_SIZE + 1)
    if len(file_bytes) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 5 MB limit."
        )

    db = get_db()
    profile = db.student_profiles.find_one({"email": current_user["email"]})
    
    # If user already had a resume in Cloudinary, delete old asset
    if profile and profile.get("resume") and profile["resume"].get("public_id"):
        delete_resume_from_cloudinary(profile["resume"]["public_id"])

    # Upload securely to Cloudinary
    user_id = str(current_user["_id"])
    cloud_result = upload_resume_to_cloudinary(file_bytes, user_id, filename)
    
    now = datetime.datetime.now(datetime.timezone.utc)
    db.student_profiles.update_one(
        {"email": current_user["email"]},
        {"$set": {
            "resume": cloud_result,
            "resume_name": filename,
            "resume_url": "/api/student/resume/me/link",
            "updated_at": now
        }},
        upsert=True
    )

    return {
        "success": True,
        "resume_name": filename,
        "resume_url": "/api/student/resume/me/link"
    }

@router.get("/resume/me/link")
def get_my_resume_link(current_user: dict = Depends(get_current_user)):
    """
    Returns a signed, short-lived (5-minute) download URL for the authenticated student's resume.
    """
    db = get_db()
    profile = db.student_profiles.find_one({"email": current_user["email"]})
    resume = profile.get("resume") if profile else None
    
    if not resume or not resume.get("public_id"):
        raise HTTPException(status_code=404, detail="No resume found for this account.")
        
    signed_url = generate_signed_resume_url(resume["public_id"], ttl_seconds=300)
    return {"url": signed_url}

@router.get("/resume/view")
def view_resume_redirect(current_user: dict = Depends(get_current_user)):
    """
    Direct authenticated browser redirect to the signed Cloudinary resume URL.
    """
    db = get_db()
    profile = db.student_profiles.find_one({"email": current_user["email"]})
    resume = profile.get("resume") if profile else None
    
    if not resume or not resume.get("public_id"):
        raise HTTPException(status_code=404, detail="No resume found.")
        
    signed_url = generate_signed_resume_url(resume["public_id"], ttl_seconds=300)
    return RedirectResponse(url=signed_url, status_code=307)
