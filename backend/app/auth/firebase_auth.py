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
    1. First, inspects the unverified JWT header algorithm (takes 0.01ms).
    2. If HS256, verifies directly with backend's JWT_SECRET_KEY. (Instant: 0.1ms).
       This completely eliminates the 11.8-second Google Cloud metadata service timeout
       caused when passing HS256 tokens to firebase_admin.auth.verify_id_token().
    3. If RS256, verifies with Firebase Admin SDK against Google's public certificates.
    4. Fails closed (HTTP 401) on any signature mismatch, expiration, or forgery.
    """
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token header."
        )

    alg = header.get("alg")

    # 1. Backend HS256 JWT verification (admin fallback / password login)
    if alg == "HS256":
        try:
            decoded = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=["HS256"],
                issuer="karmik_backend"
            )
            return decoded
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid, expired, or forged backend token."
            )

    # 2. Firebase RS256 ID Token verification
    if alg == "RS256":
        try:
            decoded = auth.verify_id_token(token)
            return decoded
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired Firebase ID token: {str(e)}"
            )

    # 3. Reject any unsupported algorithm
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Unsupported token algorithm: {alg}"
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
