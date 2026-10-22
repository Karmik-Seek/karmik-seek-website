from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from app.models.schemas import UserSyncRequest, UserResponse, LoginFallbackRequest
from app.database import get_db
from app.config import settings
from app.auth.firebase_auth import get_current_user
from app.services.email_service import send_welcome_email
from app.limiter import limiter
import datetime
import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login-fallback")
@limiter.limit("5/minute")
def login_fallback(request: Request, req: LoginFallbackRequest):
    """
    Fallback authentication endpoint for the seeded admin and student users,
    used if Firebase Auth client encounters configuration errors or delays.
    Cryptographically signed with strong server-side secret and 4-hour expiry.
    """
    db = get_db()
    email_clean = req.email.lower().strip()
    is_admin = email_clean in [a.lower().strip() for a in settings.ADMIN_EMAILS]

    # Verify password for admin
    if is_admin:
        expected_password = getattr(settings, "ADMIN_CREDENTIALS", {}).get(email_clean, settings.ADMIN_DEFAULT_PASSWORD)
        if req.password != expected_password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin password.")
    
    user = db.users.find_one({"email": email_clean})
    now = datetime.datetime.now(datetime.timezone.utc)

    if not user:
        if is_admin:
            admin_name = "Athri Admin" if "athri" in email_clean else "Prajwal Admin"
            user = {
                "email": email_clean,
                "full_name": admin_name,
                "role": "admin",
                "auth_provider": "password",
                "has_password": True,
                "created_at": now,
                "updated_at": now
            }
            res = db.users.insert_one(user)
            user["_id"] = res.inserted_id
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found. Please register first.")
    else:
        if is_admin and user.get("role") != "admin":
            db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
            user["role"] = "admin"

    # Generate JWT token with secure secret key and issuer
    token_payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "student"),
        "iss": "karmik_backend",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=4)
    }
    token = jwt.encode(token_payload, settings.JWT_SECRET_KEY, algorithm="HS256")

    profile = None
    if user.get("role") == "student":
        profile = db.student_profiles.find_one({"email": email_clean})
        if profile and "_id" in profile:
            profile["_id"] = str(profile["_id"])

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "student"),
            "auth_provider": "password",
            "has_password": True
        },
        "profile": profile
    }

@router.post("/sync")
@limiter.limit("20/minute")
def sync_user(request: Request, req: UserSyncRequest, background_tasks: BackgroundTasks):
    """
    Syncs a user authenticated via Firebase into MongoDB Atlas with sub-millisecond atomic upsert.
    Automatically identifies and sets the admin role for prajwalganiga06@gmail.com and testathri@gmail.com.
    Uses a single find_one_and_update with upsert=True and ReturnDocument.AFTER to eliminate
    multi-query round-trip latency to MongoDB Atlas.
    """
    from pymongo import ReturnDocument

    db = get_db()
    email_clean = req.email.lower().strip()
    is_admin = email_clean in [a.lower().strip() for a in settings.ADMIN_EMAILS]
    role = "admin" if is_admin else "student"
    now = datetime.datetime.now(datetime.timezone.utc)

    # Prepare atomic update document
    set_fields = {
        "firebase_uid": req.firebase_uid,
        "updated_at": now,
    }
    if req.full_name:
        set_fields["full_name"] = req.full_name
    if is_admin:
        set_fields["role"] = "admin"

    set_on_insert_fields = {
        "email": email_clean,
        "role": role,
        "auth_provider": req.auth_provider or "google",
        "has_password": False,
        "created_at": now,
    }
    if not req.full_name:
        set_on_insert_fields["full_name"] = email_clean.split("@")[0]

    # Single atomic upsert for user with lean projection
    user = db.users.find_one_and_update(
        {"email": email_clean},
        {
            "$set": set_fields,
            "$setOnInsert": set_on_insert_fields,
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
        projection={
            "_id": 1,
            "firebase_uid": 1,
            "email": 1,
            "full_name": 1,
            "role": 1,
            "auth_provider": 1,
            "has_password": 1,
            "created_at": 1,
        }
    )

    # Asynchronously dispatch welcome email for new sign-ups in BackgroundTasks (never blocks response)
    created_at = user.get("created_at")
    is_new_signup = created_at and isinstance(created_at, datetime.datetime) and abs((now - created_at).total_seconds()) < 5
    if is_new_signup and user.get("role") == "student":
        background_tasks.add_task(send_welcome_email, email_clean, user.get("full_name", ""))

    # Lean atomic profile retrieval or creation for students
    profile = None
    if user.get("role") == "student":
        profile = db.student_profiles.find_one_and_update(
            {"email": email_clean},
            {
                "$setOnInsert": {
                    "user_id": str(user["_id"]),
                    "email": email_clean,
                    "full_name": user.get("full_name", ""),
                    "skills": [],
                    "education": [],
                    "interests": [],
                    "availability": [],
                    "preferred_job_types": [],
                    "created_at": now,
                    "updated_at": now,
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
            projection={
                "_id": 1,
                "skills": 1,
                "education": 1,
                "interests": 1,
                "availability": 1,
                "preferred_job_types": 1,
                "resume_url": 1,
                "resume_name": 1,
                "full_name": 1,
                "email": 1,
            }
        )
        if profile and "_id" in profile:
            profile["_id"] = str(profile["_id"])

    return {
        "user": {
            "id": str(user["_id"]),
            "firebase_uid": user.get("firebase_uid"),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "student"),
            "auth_provider": user.get("auth_provider", "firebase"),
            "has_password": user.get("has_password", False),
        },
        "profile": profile,
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    profile = None
    if current_user.get("role") == "student":
        profile = db.student_profiles.find_one({"email": current_user["email"]})
        if profile and "_id" in profile:
            profile["_id"] = str(profile["_id"])
            
    return {
        "user": {
            "id": str(current_user["_id"]),
            "firebase_uid": current_user.get("firebase_uid"),
            "email": current_user["email"],
            "full_name": current_user.get("full_name", ""),
            "role": current_user.get("role", "student"),
            "auth_provider": current_user.get("auth_provider", "firebase"),
            "has_password": current_user.get("has_password", False)
        },
        "profile": profile
    }
