# Kaarmik Seek: Security Fixes Guide

**Stack:** FastAPI (Render Free) · Next.js (Vercel) · MongoDB Atlas · Firebase Auth · Cloudinary (resume storage)
**Based on:** `security_and_load_assessment.md` (report date October 21, 2026)

This document covers the fix for each of the 5 findings, the Cloudinary resume setup, Render Free-tier design notes, extra hardening, and a verification checklist.

---

## 0. Summary and Priority

| Order | Finding                                            | Severity | Fix                                                                        | Effort   |
| ----- | -------------------------------------------------- | -------- | -------------------------------------------------------------------------- | -------- |
| 1     | Firebase JWT signature verification disabled       | Critical | Verify with `firebase-admin`                                               | ~15 min  |
| 2     | Hardcoded fallback JWT secret                      | High     | Delete the fallback login                                                  | ~10 min  |
| 3     | Path traversal and unauthenticated resume download | High     | Store resumes in Cloudinary (authenticated) with signed, short-lived links | ~1-2 hrs |
| 4     | Overly permissive CORS                             | Medium   | Explicit origin list, no credentials                                       | ~5 min   |
| 5     | No rate limiting; email abuse                      | Medium   | `slowapi` + per-user daily caps in MongoDB                                 | ~45 min  |

**Do Finding 1 first.** Until it is fixed, anyone can forge a token and become admin. Also **rotate all secrets** (section 8).

---

## 1. Finding 1: Verify the Firebase Token Signature (CRITICAL)

### Problem

`jwt.decode(token, options={"verify_signature": False})` trusts any token. An attacker can forge a token with an admin email.

### Fix

Use the Firebase Admin SDK, which checks the signature, expiry, issuer and audience.

```python
# backend/app/auth/firebase_auth.py
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

if not firebase_admin._apps:
    firebase_admin.initialize_app(
        credentials.Certificate(json.loads(settings.FIREBASE_CREDENTIALS_JSON))
    )

bearer = HTTPBearer(auto_error=False)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        decoded = auth.verify_id_token(creds.credentials)   # signature, expiry, audience
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not decoded.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")
    return decoded


def require_admin(user=Depends(get_current_user)):
    if user.get("email", "").lower() not in settings.admin_emails_set:
        raise HTTPException(status_code=403, detail="Admins only")
    return user
```

```python
# backend/app/config.py (relevant parts)
class Settings(BaseSettings):
    FIREBASE_CREDENTIALS_JSON: str            # whole service-account JSON as one env var
    ADMIN_EMAILS: str = ""                    # comma-separated

    @property
    def admin_emails_set(self) -> set[str]:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}
```

### Checklist

- [ ] Service-account JSON stored only in Render env vars (never committed).
- [ ] Admin emails read from `ADMIN_EMAILS`, not hardcoded in source.
- [ ] `email_verified` required.
- [ ] Every protected route uses `Depends(get_current_user)` or `Depends(require_admin)`.
- [ ] Only `/api/health`, public job listing and `/api/auth/sync` (which verifies its own token) are open.

---

## 2. Finding 3 (HIGH): Remove the Hardcoded Fallback Secret

### Problem

`jwt.encode(payload, "karmik_fallback_secret", algorithm="HS256")` lets anyone with the source code forge fallback tokens.

### Fix

**Delete the fallback login entirely** (`/api/auth/login-fallback` and the fallback token code). A second, weaker login path is the real vulnerability, and a stronger secret would only hide it. If Firebase verification fails, the request must fail with 401 (fail closed).

If you absolutely must keep a non-Firebase login (not recommended):

```python
JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]   # crash at startup if missing; generate with: python -c "import secrets; print(secrets.token_urlsafe(64))"
```

and give those tokens a short expiry (15 minutes) and a distinct `iss` claim.

### Checklist

- [ ] Fallback route and `"karmik_fallback_secret"` removed from the codebase and Git history cleaned if the repo was ever public.
- [ ] No other hardcoded secrets (`grep -rn "secret\|password\|api_key" backend/`).

---

## 3. Finding 2 (HIGH): Resume Download: Path Traversal and No Auth, Fixed with Cloudinary

```env
# Cloudinary Environment Variable (configured securely in .env and Render)
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
```

### Problem

`GET /api/student/resume/{filename}` joins a client-supplied filename onto `UPLOAD_DIR` with no sanitizing and no authentication. It allows `..%2F..%2F.env` style reads and resume enumeration. In addition, **Render Free has a temporary filesystem**, so uploaded files can disappear on any restart or redeploy.

### Fix overview

Store resumes in **Cloudinary** as **raw, authenticated** assets. The backend validates the file, uploads it, saves only the `public_id` in MongoDB, and serves **short-lived signed links** after checking permissions. No file paths exist anymore, so path traversal is impossible.

```text
Upload:   Student → FastAPI (validate size + magic bytes) → Cloudinary (raw, authenticated)
Download: Request → FastAPI (owner or admin check) → signed link, expires in ~5 minutes
```

### 3.1 Cloudinary account setup

1. Create a Cloudinary account and copy the **API environment variable** (`CLOUDINARY_URL`) from the dashboard.
2. Go to **Settings → Security** and enable **"Allow delivery of PDF and ZIP files"**. Free accounts block PDF delivery by default, and downloads fail (401) without it.
3. Add `CLOUDINARY_URL` to Render environment variables:
   ```env
   CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
   ```
4. Install the SDK: add `cloudinary` to `backend/requirements.txt`.

### 3.2 Why these upload options

| Option          | Value                          | Reason                                                                                           |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `resource_type` | `"raw"`                        | Stores PDF/DOC/DOCX as plain files. By default PDFs are treated as images, which you don't need  |
| `type`          | `"authenticated"`              | Original file is reachable **only** through signed URLs (default `upload` type is a public link) |
| `public_id`     | `resumes/<uid>/<random>.<ext>` | Per-user folder + random name, never the client's filename                                       |

### 3.3 Upload endpoint

```python
# backend/app/routers/student_routes.py
import io, time, uuid
import cloudinary, cloudinary.uploader, cloudinary.utils
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.auth.firebase_auth import get_current_user

MAX = 5 * 1024 * 1024  # 5 MB

# magic bytes -> content type
MAGIC = {
    b"%PDF-": "application/pdf",
    b"PK\x03\x04": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx (zip)
    b"\xd0\xcf\x11\xe0": "application/msword",                                                   # .doc
}
EXT = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


@router.post("/resume")
def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = file.file.read(MAX + 1)                    # never read more than the limit
    if len(data) > MAX:
        raise HTTPException(413, "File too large (5 MB max)")
    ctype = next((t for sig, t in MAGIC.items() if data.startswith(sig)), None)
    if not ctype:
        raise HTTPException(400, "Only PDF, DOC and DOCX files are allowed")

    ext = EXT[ctype]
    res = cloudinary.uploader.upload(
        io.BytesIO(data),
        resource_type="raw",
        type="authenticated",                                          # NOT public
        public_id=f"resumes/{user['uid']}/{uuid.uuid4().hex}.{ext}",
    )

    profile = db.student_profiles.find_one({"firebase_uid": user["uid"]}) or {}
    old = (profile.get("resume") or {}).get("public_id")
    if old:                                                            # replace previous resume
        cloudinary.uploader.destroy(
            old, resource_type="raw", type="authenticated", invalidate=True
        )

    db.student_profiles.update_one(
        {"firebase_uid": user["uid"]},
        {"$set": {"resume": {
            "public_id": res["public_id"],
            "ext": ext,
            "size": res["bytes"],
            "content_type": ctype,
        }}},
    )
    return {"ok": True}
```

### 3.4 Download endpoints (student and admin)

```python
def _signed_link(resume: dict, ttl: int = 300) -> str:
    return cloudinary.utils.private_download_url(
        resume["public_id"], "",                       # for raw assets the extension is already in public_id
        resource_type="raw",
        type="authenticated",
        expires_at=int(time.time()) + ttl,             # 5 minutes
    )


@router.get("/resume/me/link")
def my_resume_link(user=Depends(get_current_user)):
    p = db.student_profiles.find_one({"firebase_uid": user["uid"]})
    resume = p and p.get("resume")
    if not resume:
        raise HTTPException(404, "No resume uploaded")
    return {"url": _signed_link(resume)}


# backend/app/routers/admin_routes.py
@router.get("/applications/{app_id}/resume-link")
def applicant_resume_link(app_id: str, admin=Depends(require_admin)):
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(400, "Invalid id")
    application = db.applications.find_one({"_id": oid})
    if not application:
        raise HTTPException(404, "Application not found")
    profile = db.student_profiles.find_one({"user_id": application["student_id"]})
    resume = profile and profile.get("resume")
    if not resume:
        raise HTTPException(404, "No resume")
    return {"url": _signed_link(resume)}
```

**Rules:**

- Never accept a `public_id`, path, or filename from the client. Look files up via the logged-in user or via the application ID (admin only).
- Never store or return a permanent URL. Return a short-lived link each time.
- Keep your own validation (size, magic bytes). Cloudinary only stores the file.

> **Note:** for raw assets the extension is part of the `public_id`, so the code passes an empty format to `private_download_url`. Run one end-to-end download test; if the link returns 404, pass `resume["ext"]` as the second argument instead.

### 3.5 Frontend usage

```ts
// lib/api.ts usage
const { url } = await api.get("/api/student/resume/me/link");
window.open(url, "_blank", "noopener,noreferrer");
```

### 3.6 Cloudinary vs. MongoDB GridFS (decision guide)

|                           | Cloudinary (authenticated)       | MongoDB GridFS              |
| ------------------------- | -------------------------------- | --------------------------- |
| Private by default        | Only if `authenticated` is set   | Yes (only via your API)     |
| Storage headroom          | Separate from Atlas quota        | Shares the ~512 MB Atlas M0 |
| Extra service and keys    | Yes                              | No                          |
| Third party holds resumes | Yes                              | No                          |
| Render bandwidth          | Light (served by Cloudinary CDN) | API streams every file      |

Choose Cloudinary for a growing user base or larger files; choose GridFS for the simplest, most private setup at small scale. Both are valid fixes for this finding.

### 3.7 Fallback (only if you keep disk storage)

```python
filename = os.path.basename(filename)
path = os.path.realpath(os.path.join(UPLOAD_DIR, filename))
if not path.startswith(os.path.realpath(UPLOAD_DIR) + os.sep):
    raise HTTPException(400, "Invalid path")
```

plus `Depends(get_current_user)` and ownership checks. This is **not recommended on Render Free** because files are lost on restart.

### Checklist

- [ ] "Allow delivery of PDF and ZIP files" enabled in Cloudinary security settings.
- [ ] `CLOUDINARY_URL` set in Render; never committed.
- [ ] Uploads are `raw` + `authenticated`.
- [ ] Only `public_id` stored in MongoDB.
- [ ] Old resume deleted on re-upload.
- [ ] Old `/resume/{filename}` route and `UPLOAD_DIR` code removed.

---

## 4. Finding 4 (MEDIUM): Restrict CORS

### Problem

`allow_origin_regex=r"^https?://.*"` with `allow_credentials=True` allows any website to make credentialed requests.

### Fix

Your app sends the Firebase token in the `Authorization` header, not cookies, so credentials mode isn't needed.

```python
# backend/app/main.py
ALLOWED_ORIGINS = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

```env
# Render (production)
ALLOWED_ORIGINS=https://kaarmikseek.vercel.app,https://karmik-seek-website.vercel.app
# Local .env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

If you need Vercel preview URLs, use a tight regex for your own project only, for example `allow_origin_regex=r"^https://karmik-seek-website-[a-z0-9-]+\.vercel\.app$"`, never `.*`.

### Checklist

- [ ] No wildcard origins and no `https?://.*` regex.
- [ ] `localhost` origins only in development.
- [ ] `allow_credentials=False`.

---

## 5. Finding 5 (MEDIUM): Rate Limiting and Email Abuse

Use **two layers**.

### 5.1 Layer 1: Burst limits with `slowapi`

```bash
pip install slowapi
```

```python
# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

```python
from fastapi import Request

@router.post("/applications")
@limiter.limit("10/minute")
def apply(request: Request, body: ApplyIn, user=Depends(get_current_user)):
    ...
```

**Render start command (important):**

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*"
```

Without `--proxy-headers`, every request appears to come from Render's proxy and all users share one limit.

**Suggested limits**

| Route                                           | Limit      |
| ----------------------------------------------- | ---------- |
| `POST /api/auth/sync`                           | 20/minute  |
| `POST /api/applications`                        | 10/minute  |
| `POST /api/student/resume`                      | 5/minute   |
| Status change / interview email actions (admin) | 60/minute  |
| Public job search                               | 120/minute |

### 5.2 Layer 2: Daily caps in MongoDB

`slowapi` stores counts in memory, and they reset when Render restarts or spins the service down. Anything protecting your email quota must live in the database.

```python
from datetime import datetime, timedelta

def can_send_email(uid: str, kind: str, daily_limit: int = 10) -> bool:
    day = datetime.utcnow().strftime("%Y-%m-%d")
    doc = db.email_quota.find_one_and_update(
        {"uid": uid, "day": day, "kind": kind},
        {"$inc": {"count": 1},
         "$setOnInsert": {"expires_at": datetime.utcnow() + timedelta(days=2)}},
        upsert=True,
        return_document=True,       # use ReturnDocument.AFTER from pymongo.collection
    )
    return doc["count"] <= daily_limit

# Create once at startup (TTL cleanup):
db.email_quota.create_index("expires_at", expireAfterSeconds=0)
db.email_quota.create_index([("uid", 1), ("day", 1), ("kind", 1)], unique=True)
```

Also:

- Keep a **global daily email counter** and stop or queue sends before reaching the provider's limit.
- Your unique `(student_id, job_id)` index already limits applications to one per job.
- Send emails with `BackgroundTasks` so slow SMTP never blocks requests.
- **Gmail SMTP** has low daily limits and a suspension risk. Prefer a transactional email provider (Resend, Brevo, SendGrid) and check its current free quota.

### Checklist

- [ ] `slowapi` on auth, apply, upload and email-triggering routes.
- [ ] Uvicorn started with `--proxy-headers`.
- [ ] Per-user and global daily email caps in MongoDB with a TTL index.
- [ ] Emails sent in background tasks.

---

## 6. Render Free-Tier Design Notes

| Limitation                                                                  | Impact                                    | What to do                                                                                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spins down after 15 minutes without inbound traffic; about a minute to wake | First visitor after idle sees a slow load | Add a free uptime monitor (UptimeRobot) pinging `/api/health` every 5 minutes, and show a "waking up" state in Next.js; or upgrade to the $7 Starter plan |
| 512 MB RAM / 0.1 CPU                                                        | Heavy work blocks everyone                | 5 MB upload cap, one worker, resume parsing in background tasks, no large in-memory caches                                                                |
| Temporary filesystem; may restart at any time                               | Files and local logs vanish               | Cloudinary for files; log to stdout                                                                                                                       |
| In-memory state resets                                                      | Rate counters and caches vanish           | Keep security-critical counters in MongoDB                                                                                                                |
| Shared monthly free instance hours                                          | Extra free services use the same quota    | One always-on API is fine; avoid extra services                                                                                                           |

**Performance (from your load report):** the database round-trip, not CPU, limits throughput (~128 req/s with Atlas vs ~1,100 req/s without). Cheap wins:

- Make sure the schema indexes exist and queries use them.
- Cache the public job list in memory for 30-60 seconds.
- Paginate every list endpoint.
- Treat the "5,000+ req/s on Vercel" number as an estimate, not a measurement.

---

## 7. Extra Hardening (not in the original report)

1. **Disable API docs in production:** `FastAPI(docs_url=None, redoc_url=None, openapi_url=None)` when `ENV=production`.
2. **Atlas network access:** Render Free has no fixed outbound IPs, so you will likely need `0.0.0.0/0`. Compensate with a long random database password and a user limited to **readWrite on your single database**.
3. **NoSQL injection:** validate every request body with Pydantic types. Never put raw request dicts or query-string values into Mongo filters. Convert IDs with `ObjectId(...)` inside try/except.
4. **Security headers in `next.config.js`:**
   ```js
   async headers() {
     return [{
       source: "/(.*)",
       headers: [
         { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
         { key: "X-Content-Type-Options", value: "nosniff" },
         { key: "X-Frame-Options", value: "DENY" },
         { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
         { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
       ],
     }];
   }
   ```
   Add a Content-Security-Policy that allows only your domain, Firebase and your API once the app is stable.
5. **Firebase:** restrict the web API key to your Vercel domains in Google Cloud Console, and list only those domains under Authentication → Settings → Authorized domains. Consider Firebase App Check if bots become a problem.
6. **Error handling:** return generic messages, log details server-side only, and never return stack traces.
7. **Dependencies:** run `pip-audit` and `npm audit` in CI and turn on Dependabot.
8. **Audit log:** record every admin action (status changes, job edits, resume views) with the admin's uid and timestamp.
9. **Input limits:** maximum lengths for text fields (cover letter, bio, skills count) to prevent database bloat.
10. **Download headers:** if you ever proxy files through your API, set `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

---

## 8. Secret Rotation (do this now)

The audit report exposes your admin email, and any secret that has ever been in a public Git commit must be treated as leaked.

- [ ] Rotate the **MongoDB Atlas** database user password.
- [ ] Rotate the **Gmail app password** (or your email provider's key).
- [ ] Generate a new **Firebase service-account key** and revoke the old one.
- [ ] Rotate the **Cloudinary API secret** if it was ever committed.
- [ ] Check history: `git log -p -S "mongodb+srv"` and similar searches for other keys.
- [ ] Confirm `.env` and any credential JSON files are in `.gitignore`.
- [ ] Update the new values only in Render and Vercel environment settings.

---

## 9. Environment Variables (Render)

```env
ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB=kaarmik_seek
FIREBASE_CREDENTIALS_JSON={...service account JSON...}
ADMIN_EMAILS=admin@yourdomain.com
ALLOWED_ORIGINS=https://kaarmikseek.vercel.app,https://karmik-seek-website.vercel.app
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
EMAIL_PROVIDER=...
EMAIL_API_KEY=...
```

Render start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*"
```

---

## 10. Verification Tests (prove each fix works)

| Test                                                               | Expected result                                 |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| Send a self-made unsigned or `alg: none` JWT to `/api/admin/stats` | **401**                                         |
| Valid student token on any `/api/admin/*` route                    | **403**                                         |
| Unverified Google account using the admin email                    | **403**                                         |
| `GET /api/student/resume/..%2F..%2F.env`                           | **404** (route removed)                         |
| Open a resume's raw Cloudinary URL without a signature             | **Fails** (not public)                          |
| Open the signed link                                               | Works, then fails after ~5 minutes              |
| Student B requests student A's resume link                         | Refused (A's file is never reachable)           |
| `curl -I -H "Origin: https://evil.com" <api>/api/jobs`             | **No** `Access-Control-Allow-Origin` header     |
| 15 rapid `POST /api/applications` calls                            | **429** after the limit                         |
| Exceed the daily email cap                                         | Email skipped or queued, request still succeeds |
| `/docs` and `/openapi.json` in production                          | **404**                                         |

---

## 11. Final Master Checklist

**Authentication and authorization**

- [ ] Firebase tokens verified with `firebase-admin` on every protected route
- [ ] Fallback login and hardcoded secret removed
- [ ] Admins defined by environment variable and `email_verified` required
- [ ] Role checks on the server for every admin endpoint

**Files**

- [ ] Resumes stored as Cloudinary `raw` + `authenticated`
- [ ] "Allow delivery of PDF and ZIP files" enabled
- [ ] Signed links expire in about 5 minutes
- [ ] No client-supplied paths or filenames
- [ ] Size and magic-byte validation on upload

**Network**

- [ ] CORS restricted to explicit origins, credentials off
- [ ] Rate limits on auth, apply, upload routes
- [ ] `--proxy-headers` enabled on Render
- [ ] Daily email caps stored in MongoDB

**Operations**

- [ ] All secrets rotated and stored only in Render/Vercel
- [ ] API docs disabled in production
- [ ] Security headers set in Next.js
- [ ] Firebase key restricted and authorized domains set
- [ ] `pip-audit` / `npm audit` / Dependabot enabled
- [ ] Audit log for admin actions
- [ ] Uptime monitor or Starter plan for cold starts
