import os
import shutil
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from app.models.schemas import StudentProfileModel
from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/api/student", tags=["student"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

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
def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]
    filename = file.filename or "resume.pdf"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed."
        )

    # Size limit 5 MB
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 5 MB."
        )

    user_id = str(current_user["_id"])
    safe_filename = f"{user_id}_{int(datetime.datetime.now().timestamp())}_{filename.replace(' ', '_')}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_url = f"/api/student/resume/{safe_filename}"
    
    db = get_db()
    db.student_profiles.update_one(
        {"email": current_user["email"]},
        {"$set": {
            "resume_url": resume_url,
            "resume_name": filename,
            "updated_at": datetime.datetime.now(datetime.timezone.utc)
        }}
    )

    return {
        "success": True,
        "resume_url": resume_url,
        "resume_name": filename
    }

@router.get("/resume/{filename}")
def get_resume_file(filename: str):
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    return FileResponse(file_path)
