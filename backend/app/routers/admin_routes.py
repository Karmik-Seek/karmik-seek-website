import datetime
from bson import ObjectId
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from app.models.schemas import StatusUpdate
from app.auth.firebase_auth import require_admin
from app.database import get_db
from app.services.email_service import send_status_update_email
from app.limiter import limiter
from app.services.cloudinary_service import generate_signed_resume_url

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
def get_admin_stats(current_user: dict = Depends(require_admin)):
    db = get_db()
    total_jobs = db.jobs.count_documents({})
    active_jobs = db.jobs.count_documents({"status": "active"})
    total_applications = db.applications.count_documents({})
    pending_reviews = db.applications.count_documents({"status": "APPLIED"})

    # Recent 5 applications
    recent_apps = list(db.applications.find({}).sort("created_at", -1).limit(5))
    formatted_recent = []
    for app in recent_apps:
        app["id"] = str(app["_id"])
        del app["_id"]
        # Attach job title
        try:
            j = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
            app["job_title"] = j.get("title") if j else "Unknown"
            app["company"] = j.get("company") if j else ""
        except Exception:
            app["job_title"] = "Unknown"
            app["company"] = ""
        formatted_recent.append(app)

    total_users = db.users.count_documents({})
    student_count = db.users.count_documents({"role": "student"})
    admin_count = db.users.count_documents({"role": "admin"})

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "pending_reviews": pending_reviews,
        "total_users": total_users,
        "student_count": student_count,
        "admin_count": admin_count,
        "recent_applications": formatted_recent
    }

@router.get("/applicants")
def get_all_applicants(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    query = {}
    if job_id and job_id != "All":
        query["job_id"] = job_id
    if status and status != "All":
        query["status"] = status

    apps = list(db.applications.find(query).sort("created_at", -1))
    result = []

    for a in apps:
        a["id"] = str(a["_id"])
        del a["_id"]

        # Attach Job
        try:
            job = db.jobs.find_one({"_id": ObjectId(a["job_id"])})
            if job:
                job["id"] = str(job["_id"])
                del job["_id"]
                a["job"] = job
        except Exception:
            a["job"] = None

        # Attach Student Profile
        prof = db.student_profiles.find_one({"$or": [{"email": a.get("student_email")}, {"user_id": a.get("student_id")}]})
        if prof:
            prof["id"] = str(prof["_id"])
            del prof["_id"]
            a["student_profile"] = prof
        else:
            a["student_profile"] = None

        result.append(a)

    return result

@router.get("/applicants/{app_id}/resume-link")
def get_applicant_resume_link(app_id: str, current_user: dict = Depends(require_admin)):
    """
    Generates a secure, 5-minute signed Cloudinary download URL for an applicant's resume.
    Accessible only by administrators.
    """
    db = get_db()
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    app_doc = db.applications.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")

    prof = db.student_profiles.find_one({
        "$or": [
            {"email": app_doc.get("student_email")},
            {"user_id": app_doc.get("student_id")}
        ]
    })
    resume = prof.get("resume") if prof else None
    if not resume or not resume.get("public_id"):
        raise HTTPException(status_code=404, detail="Applicant has not uploaded a resume")

    signed_url = generate_signed_resume_url(resume["public_id"], ttl_seconds=300)
    return {"url": signed_url}

@router.patch("/applicants/{app_id}/status")
@limiter.limit("60/minute")
def update_applicant_status(
    request: Request,
    app_id: str,
    update: StatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    app = db.applications.find_one({"_id": oid})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    now = datetime.datetime.now(datetime.timezone.utc)
    new_status = update.status
    note = update.note or f"Status changed to {new_status} by admin"

    history_entry = {
        "status": new_status,
        "note": note,
        "changed_at": now.isoformat()
    }

    update_fields = {
        "status": new_status,
        "updated_at": now
    }

    if update.interview_details and update.interview_details.date:
        update_fields["interview_details"] = update.interview_details.dict()

    db.applications.update_one(
        {"_id": oid},
        {
            "$set": update_fields,
            "$push": {"status_history": history_entry}
        }
    )

    updated = db.applications.find_one({"_id": oid})
    updated["id"] = str(updated["_id"])
    del updated["_id"]

    # Retrieve student email and job details for email notification
    student_email = app.get("student_email")
    student_name = app.get("student_name", "")
    if not student_email and app.get("student_id"):
        try:
            student_user = db.users.find_one({"_id": ObjectId(app["student_id"])})
            if student_user:
                student_email = student_user.get("email")
                if not student_name:
                    student_name = student_user.get("full_name", "")
        except Exception:
            pass

    job = None
    if app.get("job_id"):
        try:
            job = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
        except Exception:
            pass

    job_title = job.get("title", "Position") if job else "Position"
    company = job.get("company", "Company") if job else "Company"

    if student_email:
        background_tasks.add_task(
            send_status_update_email,
            student_email=student_email,
            student_name=student_name,
            job_title=job_title,
            company=company,
            new_status=new_status,
            note=update.note or "",
            interview_details=update.interview_details.dict() if update.interview_details else None
        )

    return updated

@router.get("/users")
def get_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    has_resume: Optional[bool] = None,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    query = {}

    if role and role.lower() != "all":
        query["role"] = role.lower()

    if search:
        s_regex = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"email": s_regex},
            {"full_name": s_regex}
        ]

    users = list(db.users.find(query).sort("created_at", -1))
    result = []

    for u in users:
        u_id = str(u["_id"])
        del u["_id"]
        u["id"] = u_id

        # Attach profile if exists
        profile = db.student_profiles.find_one({"$or": [{"email": u["email"]}, {"user_id": u_id}]})
        if profile:
            profile["id"] = str(profile["_id"])
            del profile["_id"]
            u["profile"] = profile
        else:
            u["profile"] = None

        # Filter by has_resume if requested
        if has_resume is not None:
            user_has_resume = bool(profile and profile.get("resume_url"))
            if has_resume != user_has_resume:
                continue

        # Count submitted applications
        app_count = db.applications.count_documents({"$or": [{"student_email": u["email"]}, {"student_id": u_id}]})
        u["applications_count"] = app_count

        result.append(u)

    return result

@router.get("/users/{user_id}")
def get_user_details(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    try:
        oid = ObjectId(user_id)
        user = db.users.find_one({"_id": oid})
    except Exception:
        user = db.users.find_one({"email": user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    u_id = str(user["_id"])
    del user["_id"]
    user["id"] = u_id

    # Attach profile
    profile = db.student_profiles.find_one({"$or": [{"email": user["email"]}, {"user_id": u_id}]})
    if profile:
        profile["id"] = str(profile["_id"])
        del profile["_id"]
        user["profile"] = profile
    else:
        user["profile"] = None

    # Attach applications
    apps = list(db.applications.find({"$or": [{"student_email": user["email"]}, {"student_id": u_id}]}).sort("created_at", -1))
    for a in apps:
        a["id"] = str(a["_id"])
        del a["_id"]
        try:
            j = db.jobs.find_one({"_id": ObjectId(a["job_id"])})
            if j:
                a["job_title"] = j.get("title")
                a["company"] = j.get("company")
        except Exception:
            pass
    user["applications"] = apps

    return user

@router.get("/users/{user_id}/resume-link")
def get_user_resume_link(user_id: str, current_user: dict = Depends(require_admin)):
    """
    Generates a secure, 5-minute signed Cloudinary download URL for a user's resume.
    Accessible only by administrators.
    """
    db = get_db()
    try:
        oid = ObjectId(user_id)
        user = db.users.find_one({"_id": oid})
    except Exception:
        user = db.users.find_one({"email": user_id})

    email = user.get("email") if user else user_id
    prof = db.student_profiles.find_one({"$or": [{"user_id": user_id}, {"email": email}]})
    resume = prof.get("resume") if prof else None
    if not resume or not resume.get("public_id"):
        raise HTTPException(status_code=404, detail="Student has not uploaded a resume")

    signed_url = generate_signed_resume_url(resume["public_id"], ttl_seconds=300)
    return {"url": signed_url}

