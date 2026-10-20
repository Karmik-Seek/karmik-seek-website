import datetime
from bson import ObjectId
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.schemas import JobCreate, JobUpdate
from app.auth.firebase_auth import get_current_user, require_admin, verify_token_and_get_claims
from app.database import get_db
from app.services.matching_service import calculate_match_score

router = APIRouter(prefix="/api/jobs", tags=["jobs"])
security = HTTPBearer(auto_error=False)

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    if not credentials:
        return None
    try:
        claims = verify_token_and_get_claims(credentials.credentials)
        email = claims.get("email") or claims.get("user_id")
        if email:
            db = get_db()
            return db.users.find_one({"email": email})
    except Exception:
        return None
    return None

@router.get("")
def list_jobs(
    search: Optional[str] = None,
    category: Optional[str] = None,
    job_type: Optional[str] = None,
    remote: Optional[bool] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    db = get_db()
    query = {"status": "active"}

    if category and category != "All":
        query["category"] = category
    if job_type and job_type != "All":
        query["job_type"] = job_type
    if remote is True:
        query["remote"] = True
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"required_skills": {"$in": [search]}}
        ]

    jobs = list(db.jobs.find(query).sort("created_at", -1))

    # Fetch profile to calculate match scores if student
    profile = None
    if current_user and current_user.get("role") == "student":
        profile = db.student_profiles.find_one({"email": current_user["email"]})

    result = []
    for j in jobs:
        j["id"] = str(j["_id"])
        del j["_id"]
        
        # Calculate match score
        match = calculate_match_score(profile, j)
        j["match_score"] = match["score"]
        j["match_explanation"] = match["explanation"]
        result.append(j)

    return result

@router.get("/{job_id}")
def get_job(job_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    db = get_db()
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job["id"] = str(job["_id"])
    del job["_id"]

    profile = None
    if current_user and current_user.get("role") == "student":
        profile = db.student_profiles.find_one({"email": current_user["email"]})

    match = calculate_match_score(profile, job)
    job["match_score"] = match["score"]
    job["match_explanation"] = match["explanation"]

    return job

@router.post("")
def create_job(data: JobCreate, current_user: dict = Depends(require_admin)):
    db = get_db()
    now = datetime.datetime.now(datetime.timezone.utc)
    new_job = data.dict()
    new_job["created_at"] = now
    new_job["updated_at"] = now
    new_job["created_by"] = str(current_user["_id"])

    res = db.jobs.insert_one(new_job)
    new_job["id"] = str(res.inserted_id)
    del new_job["_id"]
    return new_job

@router.put("/{job_id}")
def update_job(job_id: str, data: JobUpdate, current_user: dict = Depends(require_admin)):
    db = get_db()
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    update_dict = {k: v for k, v in data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.datetime.now(datetime.timezone.utc)

    db.jobs.update_one({"_id": oid}, {"$set": update_dict})
    updated = db.jobs.find_one({"_id": oid})
    if not updated:
        raise HTTPException(status_code=404, detail="Job not found")
    
    updated["id"] = str(updated["_id"])
    del updated["_id"]
    return updated

@router.delete("/{job_id}")
def delete_job(job_id: str, current_user: dict = Depends(require_admin)):
    db = get_db()
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    res = db.jobs.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job deleted"}
