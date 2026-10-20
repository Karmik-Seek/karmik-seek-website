# Kaarmik Seek: Upgrade Plan (Next.js + FastAPI + MongoDB Atlas + Firebase Auth)

This document defines how Kaarmik Seek moves off Supabase and onto a new stack. The **features and workflow stay the same**, the **UI style is kept**, and the product gets a public marketing landing page, a proper email system, and a more reliable backend.

---

## 1. Goals

1. Remove Supabase completely (Auth, Postgres, Storage, Edge Functions, RPC).
2. New stack:
   - **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
   - **Backend:** FastAPI (Python 3.11+, async)
   - **Database:** MongoDB Atlas
   - **Auth:** Firebase Authentication (Google Sign-In + Email/Password)
3. Keep the core workflow: **Register → Complete profile → Browse jobs → Apply → Shortlisted → Interview Scheduled → Selected / Rejected**.
4. Add **templated status emails** to candidates and **notification emails** to admins.
5. Add a **public hero/landing site** so the candidate side is not just a static dashboard.
6. Fix the weaknesses of the current build (listed in section 2).

---

## 2. Known Flaws in the Current App and How the Upgrade Fixes Them

| # | Current problem | Upgrade fix |
|---|---|---|
| 1 | Match scoring runs in the browser (`matching.ts`), so it can be tampered with and score snapshots can be forged | Scoring runs **only on FastAPI**; the snapshot is stored server-side at apply time |
| 2 | Admin activation via a shared secret code (`bootstrap_admin`) | Admin role comes from an **env-based allowlist + invite flow**, enforced by the backend. Role is set as a Firebase custom claim and mirrored in MongoDB |
| 3 | Role checks happen partly on the client | **Every protected endpoint** checks the token and role on the server (FastAPI dependencies) |
| 4 | Status changes can be arbitrary | A **status state machine** validates allowed transitions (section 6.3) |
| 5 | Emails depend on an edge function, with no templates or logs | Dedicated **email service** with HTML templates, background sending, retries, and an `email_logs` collection |
| 6 | Resume handling is tied to Supabase Storage | Resume files go to a configurable storage backend with server-side validation (section 8) |
| 7 | Keyword matching only | Skill normalization and synonym handling, with optional semantic matching later |
| 8 | Dashboard-only candidate experience | Public landing page, company story, CTA to register (section 7) |
| 9 | No pagination, rate limiting, or audit trail | Pagination on every list, rate limiting on sensitive routes, audit log for admin actions |

---

## 3. Target Architecture

```text
Karmik-Seek/
├── frontend/                      # Next.js app
│   ├── app/
│   │   ├── (public)/              # Landing page, about, contact
│   │   │   ├── page.tsx           # Hero landing page
│   │   │   └── jobs/              # Public job listing (SEO, no login needed to browse)
│   │   ├── (auth)/login/
│   │   ├── (auth)/register/
│   │   ├── (student)/dashboard/
│   │   ├── (student)/jobs/[id]/
│   │   ├── (student)/applications/
│   │   ├── (student)/profile/
│   │   └── (admin)/admin/
│   │       ├── dashboard/
│   │       ├── jobs/
│   │       ├── applicants/
│   │       ├── email-templates/
│   │       └── notifications/
│   ├── components/
│   ├── lib/
│   │   ├── firebase.ts            # Firebase client SDK
│   │   ├── api.ts                 # fetch wrapper that attaches Firebase ID token
│   │   └── types.ts
│   ├── middleware.ts              # Route protection (redirects)
│   └── .env.local
│
├── backend/                       # FastAPI app
│   ├── app/
│   │   ├── main.py                # App, CORS, router registration
│   │   ├── config.py              # Pydantic Settings from env
│   │   ├── database.py            # Motor client, index creation on startup
│   │   ├── auth/
│   │   │   ├── firebase_auth.py   # verify_id_token, current user dependency
│   │   │   └── permissions.py     # require_student, require_admin
│   │   ├── models/                # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── auth_routes.py
│   │   │   ├── student_routes.py
│   │   │   ├── job_routes.py
│   │   │   ├── application_routes.py
│   │   │   ├── admin_routes.py
│   │   │   └── notification_routes.py
│   │   ├── services/
│   │   │   ├── matching_service.py
│   │   │   ├── resume_service.py
│   │   │   ├── email_service.py
│   │   │   ├── storage_service.py
│   │   │   └── status_service.py  # state machine + history
│   │   └── templates/emails/      # Jinja2 HTML templates
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── docs/
└── README.md
```

**Request flow**

```text
Browser (Next.js) ──Firebase ID token──▶ FastAPI ──▶ MongoDB Atlas
        │                                   │
        └── Firebase Auth (login only)      └── Email provider (SMTP / Resend / SendGrid)
                                            └── File storage (resumes)
```

Next.js never talks to MongoDB directly. All data goes through FastAPI.

---

## 4. Authentication Design (Firebase + MongoDB)

### 4.1 Login methods
- **Google Sign-In** (primary)
- **Email + Password** (also handled by Firebase)

### 4.2 About "storing the password in the database"
The earlier draft planned a `password_hash` field in MongoDB. **The recommendation is not to do that.** Firebase already stores and secures passwords (hashing, reset, brute-force protection). Duplicating hashes in MongoDB adds risk and gives no benefit.

How password login for Google users works instead:
- A Google user can **set a password** in Profile Settings. The frontend calls Firebase `linkWithCredential(EmailAuthProvider.credential(email, password))`, which adds email/password login to the same Firebase account.
- MongoDB stores only a flag: `has_password: true` and `auth_providers: ["google", "password"]`.
- Forgot password uses Firebase `sendPasswordResetEmail`.

The user still gets exactly what was asked (Google login plus a password they can log in with), and the account is stored in MongoDB.

### 4.3 Sync flow
1. User signs in with Firebase on the client and gets an ID token.
2. Client calls `POST /api/auth/sync` with `Authorization: Bearer <token>`.
3. FastAPI verifies the token with the Firebase Admin SDK.
4. If no user exists, create a `users` document (role `student`) and an empty `student_profiles` document. If the email is in the admin allowlist, role is `admin`.
5. Return user + profile. The client stores it in app state.
6. Send a **welcome email** on first creation and an admin notification if enabled.

### 4.4 Admin access (replaces the secret code)
- `ADMIN_EMAILS` env var holds initial admins.
- Existing admins can **invite** other admins by email from the admin panel (`admin_invites` collection, expiring token).
- On promotion, the backend sets a Firebase custom claim `role=admin` and updates MongoDB.
- Role is verified server-side on every admin request; frontend route guards are only for UX.

---

## 5. MongoDB Atlas Data Model

Use **Motor** (async driver) with Pydantic models. Create indexes at startup.

### 5.1 Collections

**`users`**
```json
{
  "_id": "ObjectId",
  "firebase_uid": "string (unique)",
  "email": "string (unique, lowercase)",
  "full_name": "string",
  "photo_url": "string | null",
  "role": "student | admin",
  "auth_providers": ["google", "password"],
  "has_password": false,
  "is_active": true,
  "last_login_at": "ISODate",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**`student_profiles`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (unique)",
  "full_name": "string",
  "phone": "string",
  "location": "string",
  "bio": "string",
  "experience": "string",
  "skills": ["python", "react"],
  "interests": [],
  "availability": ["Weekdays"],
  "preferred_job_types": ["Internship"],
  "education": [{ "id": "uuid", "institution": "", "degree": "", "field": "", "year": "" }],
  "resume": { "file_id": "", "name": "", "size": 0, "content_type": "", "uploaded_at": "ISODate" },
  "parsed_resume_text": "string",
  "profile_completion": 80,
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**`jobs`**
```json
{
  "_id": "ObjectId",
  "title": "", "company": "", "description": "",
  "required_skills": [],
  "category": "Technology",
  "job_type": "Internship",
  "location": "", "remote": true,
  "salary_or_stipend": "", "eligibility": "",
  "deadline": "ISODate",
  "status": "active | closed",
  "created_by": "ObjectId",
  "created_at": "ISODate", "updated_at": "ISODate"
}
```

**`applications`**
```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId",
  "job_id": "ObjectId",
  "cover_letter": "",
  "status": "APPLIED | SHORTLISTED | INTERVIEW_SCHEDULED | SELECTED | REJECTED | WITHDRAWN",
  "match_score": 88,
  "match_explanation": { "matched_skills": [], "missing_skills": [], "breakdown": {}, "summary": "" },
  "interview_details": { "date": "", "time": "", "mode": "online|offline", "link_or_location": "", "instructions": "" },
  "status_history": [{ "status": "", "note": "", "changed_by": "ObjectId", "changed_at": "ISODate" }],
  "created_at": "ISODate", "updated_at": "ISODate"
}
```

**`notifications`** (admin inbox), **`admin_settings`** (single doc), **`admin_invites`**, **`email_templates`** (editable subject and body per event), **`email_logs`** (`to`, `template`, `status`, `error`, `application_id`, `sent_at`), **`audit_logs`** (`actor_id`, `action`, `target`, `meta`, `created_at`).

### 5.2 Indexes
- `users`: unique `firebase_uid`, unique `email`
- `student_profiles`: unique `user_id`
- `jobs`: `status`, `deadline`, `category`, `job_type`, and a **text index** on `title`, `company`, `description`
- `applications`: **unique compound `(student_id, job_id)`** (prevents duplicate applications at the database level), plus `job_id + status` and `student_id + created_at`
- `notifications`: `read_at`, `created_at`
- `email_logs`: `application_id`, `created_at`

---

## 6. Backend (FastAPI)

### 6.1 API Endpoints

**Auth**
- `POST /api/auth/sync` verifies token, provisions user, returns user + profile
- `POST /api/auth/password-linked` marks `has_password = true` after the client links a password
- `GET /api/auth/me`

**Student**
- `GET/PUT /api/student/profile`
- `POST /api/student/resume` (upload), `DELETE /api/student/resume`, `GET /api/student/resume/download`
- `GET /api/student/dashboard` (counts, recommended jobs, recent applications)

**Jobs (public and student)**
- `GET /api/jobs?search=&category=&job_type=&remote=&page=&limit=`
- `GET /api/jobs/{id}`
- `GET /api/jobs/{id}/match` (match analysis for the logged-in student)

**Applications**
- `POST /api/applications` (`job_id`, `cover_letter`)
- `GET /api/applications/me`
- `POST /api/applications/{id}/withdraw`

**Admin**
- `GET /api/admin/stats`
- `POST/PUT/DELETE /api/admin/jobs`, `PATCH /api/admin/jobs/{id}/status`
- `GET /api/admin/applicants?job_id=&status=&page=`
- `GET /api/admin/applicants/{application_id}` (full candidate view)
- `PATCH /api/admin/applications/{id}/status` (shortlist, select, reject)
- `POST /api/admin/applications/{id}/interview` (schedule interview)
- `GET /api/admin/applications/{id}/resume`
- `GET/PUT /api/admin/settings`
- `GET /api/admin/notifications`, `PATCH /api/admin/notifications/{id}/read`, `POST /api/admin/notifications/read-all`
- `GET/PUT /api/admin/email-templates`, `POST /api/admin/email-templates/{key}/test`
- `POST /api/admin/invite`

### 6.2 Matching Engine (server-side)
Keep the existing weighted model so scores stay familiar:

| Component | Weight |
|---|---|
| Skills | 50 |
| Education / eligibility | 15 |
| Experience | 10 |
| Availability / job type | 15 |
| Location / remote | 10 |

Improvements:
- Normalize skills (lowercase, trim, alias map such as `js → javascript`, `reactjs → react`).
- Optionally include skills detected from `parsed_resume_text`.
- Snapshot score and explanation at apply time (immutable); the live score is shown separately on job pages.
- Phase 2: embedding-based semantic score blended into the experience component.

### 6.3 Status State Machine

```text
APPLIED ──▶ SHORTLISTED ──▶ INTERVIEW_SCHEDULED ──▶ SELECTED
   │            │                    │
   └────────────┴────────────────────┴──▶ REJECTED

APPLIED / SHORTLISTED / INTERVIEW_SCHEDULED ──▶ WITHDRAWN (student only)
```

- Invalid transitions return `400`.
- Every transition appends to `status_history` with actor and note.
- Every transition triggers the matching email (section 9) and writes an audit log.
- Applications to **closed jobs or past-deadline jobs** are rejected by the API.

### 6.4 Cross-cutting
- CORS limited to the frontend origin.
- Rate limiting (e.g. `slowapi`) on auth, apply, and upload routes.
- Consistent error format and request validation via Pydantic.
- Pagination everywhere (`page`, `limit`, `total`).
- Structured logging; health check at `/health`.

---

## 7. Frontend (Next.js)

### 7.1 Public Landing Page (new)
The first thing visitors see, not a dashboard:
- **Hero:** headline about the company, a short value statement, and CTAs "Get Started" and "Browse Jobs", plus a visual or illustration.
- **Stats strip:** students registered, jobs posted, companies hiring, placements (live from `/api/public/stats`).
- **How it works:** Register → Build profile → Apply → Track progress → Get selected.
- **Featured jobs** (latest active jobs, visible without login).
- **Why Kaarmik Seek:** smart job matching, transparent tracking, email updates.
- **Testimonials / partner companies** section.
- **Footer** with contact and policy links.
- SEO metadata and Open Graph tags (a core Next.js benefit).

### 7.2 Candidate Side
Same pages and look as today: Dashboard, Jobs, Job Detail with match analysis, Applications tracker with status timeline, Profile.

Additions:
- Visual **progress stepper** per application: Applied → Shortlisted → Interview → Selected.
- Profile completion meter.
- Resume upload with drag and drop and progress.
- "Set a password" banner for Google-only users.

### 7.3 Admin Side
Same as today (dashboard, job management, applicants pipeline, notifications), plus:
- **Kanban or table pipeline** view per job.
- **Email template editor** with preview and a "send test" button.
- Bulk actions (shortlist or reject several candidates).
- Export applicants to CSV.
- Audit log view.

### 7.4 Frontend Technical Notes
- Auth state via Firebase `onAuthStateChanged`; `lib/api.ts` attaches a fresh ID token to every request.
- `middleware.ts` plus layout-level guards for `/dashboard`, `/admin`, etc.
- Use TanStack Query (or SWR) for data fetching and caching.
- Form validation with React Hook Form and Zod.
- Toasts, loading skeletons, and empty states on all screens.

---

## 8. Resume Storage

Supabase Storage is removed. Choose one:

| Option | Pros | Cons |
|---|---|---|
| **MongoDB GridFS** (inside Atlas) | One system, simplest setup | Uses Atlas storage; no CDN |
| **Firebase Storage / S3 / Cloudinary** | Scales well, signed URLs | One more service |

**Recommendation:** start with **GridFS** (matches "MongoDB Atlas for the entire project"), behind a `storage_service` interface so it can be swapped later.

Rules (enforced on the server, not only the client):
- Allowed: `.pdf`, `.doc`, `.docx`; max **5 MB**; check MIME type and file signature.
- Uploading a new resume deletes the previous file.
- Downloads go through authenticated endpoints; students can access only their own file, admins can access applicants' files.
- After upload, extract text with `pypdf` / `pdfplumber` (PDF) and `python-docx` (DOCX) into `parsed_resume_text`, and optionally suggest skills for the student to confirm.

---

## 9. Email System

### 9.1 Provider
Use **SMTP** (Gmail Workspace or similar) or an API provider (**Resend** or **SendGrid**). Sending runs in FastAPI `BackgroundTasks` so API responses are never blocked, with a retry and an entry in `email_logs`.

### 9.2 Templates (Jinja2, branded HTML + plain-text fallback)

| Key | Sent to | When |
|---|---|---|
| `welcome` | Student | First sign-in |
| `application_received` | Student | After applying |
| `shortlisted` | Student | Status → SHORTLISTED |
| `interview_scheduled` | Student | Interview scheduled (date, time, mode, link or location) |
| `selected` | Student | Status → SELECTED |
| `rejected` | Student | Status → REJECTED (polite wording) |
| `application_withdrawn` | Student and admin | Student withdraws |
| `admin_new_registration` | Admin | New student (if enabled) |
| `admin_new_application` | Admin | New application (if enabled) |
| `deadline_reminder` | Student | Optional: job deadline approaching for saved or matched jobs |

Each candidate email includes: greeting, job title and company, the new status, a short progress tracker, relevant details (such as interview info), a "View my application" button, and the company footer.

### 9.3 Admin control
- Edit subject and body from the **Email Templates** page with variables like `{{student_name}}`, `{{job_title}}`, `{{company}}`, `{{interview_date}}`.
- Preview, send a test, and see delivery status in logs.
- Failed sends are visible and can be retried.

---

## 10. Security Checklist

- Verify Firebase ID tokens on every request; reject expired or invalid tokens.
- Server-side role checks on all admin routes.
- Students can only read and modify their own profile, applications, and resume.
- No secrets in the frontend; only public Firebase config is exposed.
- Strict input validation; escape or sanitize rich text shown in the UI.
- Restrict Atlas network access (IP allowlist) and use a least-privilege database user.
- Rate limit auth, apply, upload, and email routes.
- Keep an audit log of admin actions.
- HTTPS everywhere; secure CORS configuration.

---

## 11. Environment Variables

**backend/.env**
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB=kaarmik_seek
FIREBASE_PROJECT_ID=
FIREBASE_CREDENTIALS_JSON=   # service account (path or JSON)
ADMIN_EMAILS=admin1@company.com,admin2@company.com
FRONTEND_URL=http://localhost:3000
EMAIL_PROVIDER=smtp          # smtp | resend | sendgrid
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM="Kaarmik Seek <no-reply@yourdomain.com>"
MAX_RESUME_MB=5
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 12. Migration of Existing Data (if any live users exist)

1. Export Supabase tables (`student_profiles`, `jobs`, `applications`, notifications) as JSON/CSV.
2. Write a one-time script that maps UUIDs to ObjectIds and converts arrays/JSONB to documents.
3. Existing email/password users **cannot** have their Supabase passwords moved. Import them into Firebase by email and ask them to **sign in with Google or use "Forgot password"** once.
4. Verify counts and sample records, then freeze the legacy app.

If the current data is only test data, skip this and start fresh.

---

## 13. Implementation Roadmap

| Phase | Scope | Result |
|---|---|---|
| **0. Setup** | Create `frontend/` and `backend/`, Atlas cluster, Firebase project, env files, Git structure | Both apps run locally |
| **1. Auth** | Firebase login (Google and email), `/auth/sync`, role guards, admin allowlist, route protection | Users can sign in; roles work |
| **2. Core data** | Models, indexes, student profile API, job CRUD, public job listing | Profiles and jobs work |
| **3. Applications** | Apply, duplicate prevention, match scoring service, state machine, status history, withdraw | Full workflow works |
| **4. Resume** | Upload, validation, storage, text extraction, admin download | Resumes work |
| **5. Email** | Provider, templates, background sending, logs, admin template editor | Candidates receive progress emails |
| **6. Admin** | Dashboard stats, pipeline views, interview scheduling, notifications and settings, audit log | Admin side complete |
| **7. Landing page and polish** | Hero landing page, stats, featured jobs, animations, responsive, empty states | Public face of the product |
| **8. QA and deploy** | Tests, security review, deploy frontend (Vercel) and backend (Render / Railway / Fly.io / VPS), Atlas production settings | Live |
| **9. Later** | Semantic matching, resume auto-fill, saved jobs, in-app notifications, analytics | Enhancements |

---

## 14. Testing and Deployment

- **Backend tests:** `pytest` + `httpx` for auth, state machine transitions, duplicate applications, matching scores, and role enforcement.
- **Frontend tests:** component tests plus Playwright for end-to-end flows (register → apply → admin shortlists → student sees status).
- **Deployment:** Next.js on Vercel; FastAPI in Docker on Render, Railway, or similar; MongoDB Atlas (M0 for dev, paid tier for production with backups enabled).
- **CI:** lint, type-check, and tests on every pull request.

---

## 15. Acceptance Checklist (the app is "working properly" when)

- [ ] A student can sign in with Google, and can also set a password and sign in with it.
- [ ] First sign-in creates the MongoDB user and profile, and sends a welcome email.
- [ ] Profile, education, skills, and resume save and reload correctly.
- [ ] Job search and filters work with pagination; match score appears on cards and details.
- [ ] A student cannot apply twice, or apply to a closed or expired job.
- [ ] Admin can create, edit, close, and delete jobs.
- [ ] Admin can move a candidate through Shortlisted → Interview → Selected / Rejected with only valid transitions.
- [ ] Each status change updates the history and sends the correct templated email.
- [ ] Interview details (date, time, link) appear in the student's tracker and in their email.
- [ ] A student cannot access admin routes or other students' data (verified server-side).
- [ ] Admin dashboard counts match the database.
- [ ] The landing page loads fast, is responsive, and leads to registration.
- [ ] No Supabase code, packages, or env variables remain.

---

## 16. Immediate Next Steps

1. Create the Atlas cluster and Firebase project (enable Google and Email/Password providers).
2. Scaffold `backend/` (FastAPI, Motor, firebase-admin) and `frontend/` (Next.js, Tailwind, Firebase SDK).
3. Build Phase 1 (authentication) first, since everything else depends on it.
4. Decide the email provider and the resume storage option (GridFS recommended to start).
