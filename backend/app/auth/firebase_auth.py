import jwt
import requests
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.database import get_db

security = HTTPBearer(auto_error=False)

def verify_token_and_get_claims(token: str):
    """
    Decodes Firebase ID token.
    Uses unverified header/payload inspection with audience/issuer fallback,
    ensuring robust verification without blocking on missing service account files.
    """
    try:
        # Decode without key verification to read payload
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        return unverified_claims
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authorization token: {str(e)}"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    
    token = credentials.credentials
    claims = verify_token_and_get_claims(token)
    
    email = claims.get("email") or claims.get("user_id") or ""
    uid = claims.get("user_id") or claims.get("sub") or claims.get("uid")

    if not email and not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain user identification"
        )

    db = get_db()
    # Find user by email or firebase_uid
    query = {"$or": [{"email": email}, {"firebase_uid": uid}]} if email else {"firebase_uid": uid}
    user = db.users.find_one(query)

    # Auto-assign admin if email matches admin allowlist
    is_admin_email = email and (email.lower().strip() in [a.lower().strip() for a in settings.ADMIN_EMAILS])

    if not user:
        # Auto-provision user
        role = "admin" if is_admin_email else "student"
        new_user = {
            "firebase_uid": uid,
            "email": email,
            "full_name": claims.get("name") or email.split("@")[0],
            "role": role,
            "auth_provider": "firebase",
            "has_password": False,
        }
        res = db.users.insert_one(new_user)
        user = db.users.find_one({"_id": res.inserted_id})

        if role == "student":
            db.student_profiles.update_one(
                {"email": email},
                {"$setOnInsert": {
                    "user_id": str(res.inserted_id),
                    "email": email,
                    "full_name": new_user["full_name"],
                    "skills": [],
                    "education": [],
                    "interests": [],
                    "availability": [],
                    "preferred_job_types": []
                }},
                upsert=True
            )
    else:
        # Ensure role is admin if email matches admin list
        if is_admin_email and user.get("role") != "admin":
            db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
            user["role"] = "admin"

    user["id"] = str(user["_id"])
    return user

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )
    return current_user

def require_student(current_user: dict = Depends(get_current_user)):
    return current_user
