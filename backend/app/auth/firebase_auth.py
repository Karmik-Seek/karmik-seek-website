import json
import jwt
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.database import get_db

# Initialize firebase_admin
if not firebase_admin._apps:
    if settings.FIREBASE_CREDENTIALS_JSON:
        try:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            firebase_admin.initialize_app(credentials.Certificate(cred_dict))
        except Exception as e:
            print(f"[WARN] Failed to parse FIREBASE_CREDENTIALS_JSON: {e}")
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
    else:
        firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})

security = HTTPBearer(auto_error=False)

def verify_token_and_get_claims(token: str) -> dict:
    """
    Cryptographically verifies the incoming token:
    1. First, verifies with Firebase Admin SDK against Google's public certificates (signature, audience, expiry).
    2. If not a Firebase token, verifies against the backend's cryptographically secure JWT_SECRET_KEY.
    3. Fails closed (HTTP 401) on any signature mismatch, expiration, or forgery.
    """
    # 1. Attempt Firebase ID Token verification
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        pass

    # 2. Attempt Backend JWT verification (fallback / admin login)
    try:
        decoded = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=["HS256"],
            issuer="karmik_backend"
        )
        return decoded
    except Exception:
        pass

    # 3. Reject unverified / forged token
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid, forged, or expired authorization token."
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
    uid = claims.get("uid") or claims.get("user_id") or claims.get("sub")

    if not email and not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain user identification"
        )

    email_clean = email.lower().strip() if email else ""
    db = get_db()
    # Find user by email or firebase_uid
    query = {"$or": [{"email": email_clean}, {"firebase_uid": uid}]} if email_clean else {"firebase_uid": uid}
    user = db.users.find_one(query)

    # Check against admin email allowlist
    is_admin_email = email_clean in settings.admin_emails_set

    if not user:
        # Auto-provision user from verified claims
        role = "admin" if is_admin_email else "student"
        new_user = {
            "firebase_uid": uid,
            "email": email_clean,
            "full_name": claims.get("name") or (email_clean.split("@")[0] if email_clean else "User"),
            "role": role,
            "auth_provider": "firebase",
            "has_password": False,
        }
        res = db.users.insert_one(new_user)
        user = db.users.find_one({"_id": res.inserted_id})

        if role == "student":
            db.student_profiles.update_one(
                {"email": email_clean},
                {"$setOnInsert": {
                    "user_id": str(res.inserted_id),
                    "email": email_clean,
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
    user_email = (current_user.get("email") or "").lower().strip()
    if current_user.get("role") != "admin" or user_email not in settings.admin_emails_set:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required."
        )
    return current_user

def require_student(current_user: dict = Depends(get_current_user)):
    return current_user
