import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from app.models.schemas import ApplicationCreate
from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.services.matching_service import calculate_match_score
from app.services.email_service import send_application_received_email
from app.limiter import limiter

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.post("")
@limiter.limit("10/minute")
def apply_to_job(
    request: Request,
    data: ApplicationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    student_id = str(current_user["_id"])
    job_id = data.job_id

    # Verify job exists
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check for existing application
    existing = db.applications.find_one({"student_id": student_id, "job_id": job_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job."
        )

    # Get student profile for match calculation
    profile = db.student_profiles.find_one({"email": current_user["email"]})
    job_dict = dict(job)
    job_dict["id"] = str(job["_id"])
    match = calculate_match_score(profile, job_dict)

    now = datetime.datetime.now(datetime.timezone.utc)
    app_doc = {
        "student_id": student_id,
        "student_email": current_user["email"],
        "student_name": current_user.get("full_name") or (profile.get("full_name") if profile else ""),
        "job_id": job_id,
        "cover_letter": data.cover_letter or "",
        "status": "APPLIED",
        "match_score": match["score"],
        "match_explanation": match["explanation"],
        "interview_details": None,
        "status_history": [
            {
                "status": "APPLIED",
                "note": "Application submitted",
                "changed_at": now.isoformat()
            }
        ],
        "created_at": now,
        "updated_at": now
    }

    res = db.applications.insert_one(app_doc)
    app_doc["id"] = str(res.inserted_id)
    del app_doc["_id"]

    # Format stipend string for email
    stipend_str = ""
    if job.get("salary_min"):
        curr = job.get("salary_currency", "₹")
        stipend_str = f"{curr}{job.get('salary_min'):,}"
        if job.get("salary_max"):
            stipend_str += f" - {curr}{job.get('salary_max'):,}"
        if job.get("job_type"):
            stipend_str += f" ({job.get('job_type')})"

    # Send confirmation email to student
    background_tasks.add_task(
        send_application_received_email,
        student_email=current_user["email"],
        student_name=app_doc["student_name"],
        job_title=job.get("title", "Position"),
        company=job.get("company", "Company"),
        job_id=job_id,
        match_score=match["score"],
        stipend=stipend_str,
        location=job.get("location", "")
    )

    return app_doc

@router.get("/my")
def get_my_applications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    student_id = str(current_user["_id"])

    apps = list(db.applications.find({"student_id": student_id}).sort("created_at", -1))
    
    result = []
    for app in apps:
        app["id"] = str(app["_id"])
        del app["_id"]

        # Join job details
        try:
            job = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                job["id"] = str(job["_id"])
                del job["_id"]
                app["job"] = job
        except Exception:
            app["job"] = None

        result.append(app)

    return result

@router.delete("/{app_id}/withdraw")
def withdraw_application(app_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    student_id = str(current_user["_id"])
    res = db.applications.delete_one({"_id": oid, "student_id": student_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")

    return {"success": True, "message": "Application withdrawn successfully"}
