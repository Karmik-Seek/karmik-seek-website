# Kaarmik Seek — System Architecture, Feature Catalog & Migration Blueprint

This document provides a complete audit of the **current Kaarmik Seek application** (features, workflows, procedures, data schemas, and role permissions) and details the **architectural blueprint for upgrading to Next.js + FastAPI + MongoDB + Firebase Google Auth**.

---

## 1. Executive Summary & Upgrade Roadmap

### Current Implementation (Vite + React + Supabase)
- **Frontend:** Single Page Application (SPA) using React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, and custom hash/history routing.
- **Backend/Database:** Supabase BaaS (PostgreSQL with Row Level Security, Supabase Auth, Supabase Storage, and Deno Edge Functions).

### Target Upgraded Architecture (Next.js + FastAPI + MongoDB + Firebase)
The project will be reorganized into a clean monorepo structure within this same repository:
```text
Karmik-Seek/
├── frontend/             # Next.js (App Router, Tailwind CSS, TypeScript, Firebase Client SDK)
├── backend/              # FastAPI (Python 3.11+, Pydantic, Motor / PyMongo, PyPDF/AI libraries)
├── PROJECT_FEATURES_AND_FLOWS.md # This specification document
└── (legacy source kept for reference during migration)
```

- **Frontend:** Next.js (React Server Components, SEO optimization, SSR/SSG capabilities, responsive design).
- **Backend:** FastAPI (Python asynchronous REST API, high performance, native integration with AI / NLP / PDF parsing libraries).
- **Database:** MongoDB (document database replacing PostgreSQL, flexible schemas for student profiles, dynamic skills, and status timelines).
- **Authentication:** Firebase Authentication with Google Sign-In, integrated with FastAPI token verification and auto-provisioning in MongoDB.

---

## 2. Current System Features & Workflows

### 2.1. Authentication & Role-Based Access Control (RBAC)

#### Roles
1. **Student:** Standard user seeking jobs and internships.
2. **Admin:** Platform administrator / employer reviewing applications, posting jobs, and managing recruitment.

#### Current Authentication Flows
- **Student Registration:**
  - Standard email and password sign-up via `supabase.auth.signUp`.
  - Automatically initializes an empty `student_profiles` row with default empty arrays for skills, education, interests, etc.
- **Student Login:**
  - Email/password authentication (`supabase.auth.signInWithPassword`).
  - Redirects to `/dashboard` upon successful login.
- **Admin Registration & Bootstrap Activation:**
  - Admin signs up as a regular user first.
  - Activates their admin privileges by submitting a **secret admin setup code** (`p_code`) verified via PostgreSQL RPC function `bootstrap_admin`.
  - When verified, the user is added to `admin_allowlist` and given `raw_app_meta_data.role = 'admin'`.
  - Redirects to `/admin`.
- **Protected Routing & Session Check:**
  - Route guards evaluate session and dynamic role via `supabase.rpc('is_admin')`.
  - Non-authenticated users are redirected to `/login`.
  - Students attempting to access `/admin/*` routes are redirected to `/dashboard`.

---

### 2.2. Student Features & Workflows

#### A. Student Profile Management (`/profile`)
- **Personal Details:** Full name, phone number, location, and brief bio/experience summary.
- **Education Section:**
  - Supports multiple education entries.
  - Fields per entry: Institution name, degree, field of study, graduation year.
- **Skills Matrix:**
  - Add/remove multiple skill tags (e.g., Python, React, Data Analysis, Communication).
- **Career Preferences:**
  - **Availability:** Multi-select options (*Weekdays, Weekends, Evenings, Full-time available, Summer break, 3 months, 6 months*).
  - **Preferred Job Types:** Multi-select options (*Part-time, Internship, Weekend, Remote, Freelance, Temporary, Contract*).
  - **Interests:** Tag-based area of interest selection.
- **Resume Upload & Management:**
  - File restrictions: Allowed formats are PDF (`.pdf`) and Word (`.doc`, `.docx`), maximum size 5 MB.
  - Uploads to the Supabase Storage bucket (`resumes/`).
  - Automatic replacement: When uploading a new resume, previous resume files are deleted.
  - Stores `resume_path` and `resume_name` on the student's profile.

#### B. Student Dashboard (`/dashboard`)
- **Key Metric Cards:**
  - Total Applications submitted.
  - Applications Under Review (`APPLIED`).
  - Shortlisted Applications (`SHORTLISTED`).
  - Scheduled Interviews (`INTERVIEW_SCHEDULED`).
  - Selections (`SELECTED`).
- **Profile Completion Prompt:** Displays banner alerting student if skills, education, or resume are missing.
- **Recommended Jobs Feed:** Displays top matching jobs computed using the matching engine.
- **Recent Applications Preview:** Fast access to the latest application statuses.

#### C. Job Discovery & Filtering (`/jobs`)
- **Search & Filters:**
  - Text search by job title, company name, or description keywords.
  - Category filter (*Technology, Marketing, Content, Design, Retail, Administration, Research, General*).
  - Job type filter (*Part-time, Internship, Weekend, Remote, Freelance, Temporary, Contract*).
  - Remote-only checkbox toggle.
- **Job Cards:**
  - Displays title, company, location, stipend/salary, job type badge, deadline badge.
  - **Dynamic Match Score Badge:** Real-time percentage badge showing how well the student fits the role.

#### D. Job Details & AI Matching Breakdown (`/jobs/:id`)
- **Role Information:** Full job description, company overview, stipend, eligibility criteria, and deadline warnings.
- **Interactive Match Analysis Box:**
  - **Overall Match Percentage** (e.g., 85% Match).
  - **Skills Match Details:** Displays which required skills the student has (`matched_skills`) and which ones they lack (`missing_skills`).
  - **Component Breakdown:** Individual sub-scores for Skills, Education, Experience, Availability, and Location.
  - **Actionable AI Summary:** Personalized feedback explaining why the score was assigned.
- **Application Submission:**
  - "Apply Now" modal with optional Cover Letter input.
  - Duplicate check: Prevents applying more than once to the same job.
  - Stores application record with an immutable snapshot of the match score and match explanation at the time of application.

#### E. My Applications Tracker (`/applications`)
- **Application List:**
  - Status badges with distinct visual indicators:
    - `APPLIED` (Blue)
    - `SHORTLISTED` (Purple)
    - `INTERVIEW_SCHEDULED` (Amber)
    - `SELECTED` (Green)
    - `REJECTED` (Red)
    - `WITHDRAWN` (Gray)
- **Status History Audit Trail:** Expandable timeline showing every status change with timestamps and notes.
- **Interview Details Box:** If status is `INTERVIEW_SCHEDULED`, displays interview date, time, and instructions.
- **Withdraw Application:** Allows students to cancel/withdraw their pending application.

---

### 2.3. Admin & Recruitment Features

#### A. Admin Dashboard (`/admin`)
- **Platform Analytics:**
  - Total Jobs posted.
  - Active Jobs currently accepting applications.
  - Total Applications received across all jobs.
  - Pending Reviews requiring administrative action.
- **Recent Applicants Table:** Quick overview of the latest candidates with match scores and status.
- **Quick Actions:** Shortcuts to post a new job or view all applicants.

#### B. Job Management (`/admin/jobs`)
- **Job Creation & Editing:**
  - Job Title, Company name, Category dropdown, Job Type dropdown.
  - Location and Remote checkbox.
  - Salary / Stipend description.
  - Eligibility requirements (degrees, branches, graduation criteria).
  - Application deadline date picker.
  - Required skills tag list.
  - Full markdown/text job description.
  - Status toggle: `active` vs `closed`.
- **Job Actions:** Edit existing jobs, toggle status, and delete job postings.

#### C. Applicant Review & Pipeline Management (`/admin/applicants`)
- **Filter Candidates:** Filter by specific Job and by current Application Status.
- **Candidate Detail Drawer / Modal:**
  - Complete student profile overview (contact info, education, skills, experience).
  - One-click resume download / preview link.
  - Match score and skill overlap analysis.
  - Cover letter text.
- **Status Workflow Actions:**
  - Single-click status transitions (`SHORTLISTED`, `SELECTED`, `REJECTED`).
  - **Schedule Interview Action:** Opens modal to input interview Date, Time, and Instructions/Meeting Link.
  - Saves transition into the `status_history` JSON log.
- **Automatic Email Notifications:** Dispatches automated email update to the candidate via edge function upon status change.

#### D. Admin Notifications & Settings (`/admin/notifications`)
- **Notification Inbox:**
  - Chronological log of student registrations and job applications.
  - Read / Unread status tracking with "Mark as Read" functionality.
- **Notification Settings:**
  - Configurable notification recipient email.
  - Toggle switch: Alert on new student registration.
  - Toggle switch: Alert on new job application.

---

## 3. Core Procedures & Algorithmic Logic

### 3.1. Job Matching Algorithm Procedure (`matching.ts`)
The matching engine compares a student's profile against a job listing using a weighted scoring model:

| Component | Weight | Calculation Method |
| :--- | :--- | :--- |
| **Skills** | **50%** | Ratio of student skills matching job's required skills: `(matched_skills.length / required_skills.length) * 50`. If no skills required, defaults to baseline 30 points. |
| **Education / Eligibility** | **15%** | Base 10 points for having education listed. Up to +5 points for keyword overlap between job eligibility text and student education/experience. |
| **Experience** | **10%** | Awarded based on whether candidate has non-empty experience details and keyword matches. |
| **Availability & Job Type** | **15%** | Matches student preferred job types (e.g. "Part-time", "Internship") against the job's type. |
| **Location & Remote** | **10%** | 10 points if job is Remote OR if student location matches job location; 5 points partial credit otherwise. |
| **Total Score** | **100%** | Sum of above components (0 - 100%). |

*Output includes:* `score` (integer), `matched_skills` (array), `missing_skills` (array), `breakdown` (object), and `summary` (string).

---

## 4. Current Database Schema (PostgreSQL Reference)

```sql
-- 1. Student Profiles
student_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  education JSONB DEFAULT '[]', -- [{ id, institution, degree, field, year }]
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  interests TEXT[] DEFAULT '{}',
  location TEXT,
  availability TEXT[] DEFAULT '{}',
  preferred_job_types TEXT[] DEFAULT '{}',
  resume_path TEXT,
  resume_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 2. Jobs
jobs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  category TEXT,
  job_type TEXT,
  location TEXT,
  remote BOOLEAN DEFAULT false,
  salary_or_stipend TEXT,
  eligibility TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active' | 'closed'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 3. Applications
applications (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  job_id UUID REFERENCES jobs(id),
  cover_letter TEXT,
  status TEXT DEFAULT 'APPLIED', -- 'APPLIED'|'SHORTLISTED'|'INTERVIEW_SCHEDULED'|'SELECTED'|'REJECTED'|'WITHDRAWN'
  match_score INTEGER,
  match_explanation JSONB,
  interview_details JSONB, -- { date, time, instructions }
  status_history JSONB DEFAULT '[]', -- [{ status, note, changed_at }]
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(student_id, job_id)
)

-- 4. Admin Settings & Notifications
admin_settings ( id INT PRIMARY KEY, notification_email TEXT, notify_on_registration BOOLEAN, notify_on_application BOOLEAN )
notifications ( id UUID PRIMARY KEY, type TEXT, subject TEXT, body TEXT, recipient_email TEXT, data JSONB, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ )
admin_allowlist ( email TEXT PRIMARY KEY, created_at TIMESTAMPTZ )
```

---

## 5. Migration Blueprint: Next.js + FastAPI + MongoDB + Firebase

### 5.1. Planned Folder Structure
```text
Karmik-Seek/
├── frontend/                     # Next.js Application
│   ├── app/                      # App Router (Pages, Layouts, Route Handlers)
│   │   ├── (auth)/login/
│   │   ├── (auth)/register/
│   │   ├── (student)/dashboard/
│   │   ├── (student)/jobs/
│   │   ├── (student)/applications/
│   │   ├── (student)/profile/
│   │   ├── (admin)/admin/dashboard/
│   │   ├── (admin)/admin/jobs/
│   │   ├── (admin)/admin/applicants/
│   │   └── (admin)/admin/notifications/
│   ├── components/               # UI Components, Modals, Navbar, StatusBadges
│   ├── lib/
│   │   ├── firebase.ts           # Firebase client initialization
│   │   ├── api.ts                # Axios/Fetch client with Bearer Token interceptor
│   │   └── types.ts              # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                      # FastAPI Application
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint & CORS middleware
│   │   ├── config.py             # Settings (MongoDB URI, Firebase credentials)
│   │   ├── database.py           # MongoDB connection (Motor / PyMongo)
│   │   ├── auth/
│   │   │   ├── firebase_auth.py  # Firebase Admin SDK token verification
│   │   │   └── permissions.py    # Role guards (student vs admin)
│   │   ├── models/               # Pydantic Schemas & MongoDB Document models
│   │   │   ├── user.py
│   │   │   ├── student.py
│   │   │   ├── job.py
│   │   │   ├── application.py
│   │   │   └── notification.py
│   │   ├── routers/
│   │   │   ├── auth_routes.py    # Sync/provision user from Firebase token
│   │   │   ├── student_routes.py # Profile, resume upload, my applications
│   │   │   ├── job_routes.py     # Public browse & search
│   │   │   ├── admin_routes.py   # Job management, candidate pipeline, notifications
│   │   │   └── ai_routes.py      # Python resume parser & match score calculation
│   │   └── services/
│   │       ├── matching_service.py # Advanced Python/NLP matching engine
│   │       ├── resume_parser.py    # PyPDF/pdfminer text extraction
│   │       └── email_service.py    # Background email dispatcher
│   ├── requirements.txt
│   └── Dockerfile
```

---

### 5.2. Firebase Google Authentication & Account Creation Procedure

As requested, authentication will use **Firebase Google Authentication** with automatic database provisioning and password management:

```
[Student / Admin]
       │
       ▼ (Clicks "Sign In with Google")
[Next.js Client]
       │
       ▼ (Firebase Client SDK: signInWithPopup(auth, googleProvider))
[Firebase Auth] ─── Returns Firebase ID Token (JWT)
       │
       ▼ (Sends Bearer Token in POST /api/auth/sync-user)
[FastAPI Backend]
       │
       ▼ (Verifies Token via firebase_admin.auth.verify_id_token(token))
[Check MongoDB 'users' Collection]
       ├── If user does NOT exist:
       │     1. Create new user document:
       │        {
       │          firebase_uid: "...",
       │          email: "student@example.com",
       │          full_name: "User Name",
       │          role: "student", # or "admin" if present in admin_whitelist
       │          auth_provider: "google",
       │          password_hash: null, # EMPTY DEFAULT PASSWORD
       │          has_password: false, # FLAG: Prompt user to set password in profile
       │          created_at: ISODate()
       │        }
       │     2. Create associated empty 'student_profiles' document.
       │
       └── If user already exists:
             Returns existing user document and profile.
```

#### Password Reset / Profile Prompt Feature
- Because Google OAuth users have no initial password (`has_password: false` and `password_hash: null`), the frontend shows a subtle banner or profile section:
  > *"You signed in using Google. Set a custom account password anytime in your Profile Settings to enable direct password login."*
- A dedicated FastAPI endpoint (`POST /api/users/set-password`) allows users to define a password if desired.

---

### 5.3. MongoDB Document Collections Schema

#### 1. `users` Collection
```json
{
  "_id": "ObjectId",
  "firebase_uid": "string (unique index)",
  "email": "string (unique index)",
  "full_name": "string",
  "role": "student | admin",
  "auth_provider": "google | email",
  "password_hash": null,
  "has_password": false,
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

#### 2. `student_profiles` Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users._id, unique index)",
  "firebase_uid": "string",
  "full_name": "string",
  "phone": "string",
  "location": "string",
  "experience": "string",
  "skills": ["Python", "FastAPI", "React", "MongoDB"],
  "interests": ["Machine Learning", "Web Development"],
  "availability": ["Weekdays", "Weekends"],
  "preferred_job_types": ["Internship", "Remote"],
  "education": [
    {
      "id": "uuid",
      "institution": "University Name",
      "degree": "B.Tech",
      "field": "Computer Science",
      "year": "2026"
    }
  ],
  "resume_url": "string (or GridFS / Cloud Storage ID)",
  "resume_name": "string",
  "parsed_resume_text": "string (extracted via Python backend)",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

#### 3. `jobs` Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "company": "string",
  "description": "string",
  "required_skills": ["Python", "Docker"],
  "category": "Technology",
  "job_type": "Internship",
  "location": "Remote / Bengaluru",
  "remote": true,
  "salary_or_stipend": "₹25,000 / month",
  "eligibility": "B.Tech / MCA 2026 Batch",
  "deadline": "ISODate",
  "status": "active | closed",
  "created_by": "ObjectId (ref: users._id)",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

#### 4. `applications` Collection
```json
{
  "_id": "ObjectId",
  "student_id": "ObjectId (ref: users._id)",
  "job_id": "ObjectId (ref: jobs._id)",
  "cover_letter": "string",
  "status": "APPLIED | SHORTLISTED | INTERVIEW_SCHEDULED | SELECTED | REJECTED | WITHDRAWN",
  "match_score": 88,
  "match_explanation": {
    "matched_skills": ["Python", "FastAPI"],
    "missing_skills": ["Docker"],
    "breakdown": {
      "skills": 40,
      "education": 15,
      "experience": 10,
      "availability": 15,
      "location": 8
    },
    "summary": "Strong match with Python expertise."
  },
  "interview_details": {
    "date": "2026-11-05",
    "time": "14:00 IST",
    "instructions": "Google Meet link: https://meet.google.com/xyz"
  },
  "status_history": [
    {
      "status": "APPLIED",
      "note": "Application submitted by student",
      "changed_at": "ISODate"
    }
  ],
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

#### 5. `notifications` & `admin_settings` Collections
- `notifications`: Audit log of system events (registrations, applications, status updates).
- `admin_settings`: Single document configuration for admin notification preferences and alerts.

---

### 5.4. Python & FastAPI Advantages in New Architecture
1. **Real AI Resume Parsing:**
   - In FastAPI, when a resume PDF is uploaded, Python libraries like `pypdf`, `pdfplumber`, or `fitz (PyMuPDF)` can immediately extract text.
   - NLP models (or an LLM integration) can automatically extract candidate skills and populate profile fields.
2. **Server-Side Semantic Matching:**
   - Instead of basic string-matching in JavaScript, FastAPI can use vector embeddings (`sentence-transformers` or OpenAI embeddings) stored in MongoDB or calculated on-the-fly to compute semantic fit between resume experience and job descriptions.
3. **Protected Business Logic:**
   - Scoring formulas and admin interview instructions are processed securely on the backend rather than in the browser.

---

## 6. Summary Checklist for Migration

- [x] Full audit of current features and flows completed.
- [x] Database schema translated from PostgreSQL to MongoDB document models.
- [x] Firebase Google Authentication workflow designed with empty default password handling.
- [x] Folder organization established: `backend/` for FastAPI and `frontend/` for Next.js.
- [ ] Initialize `backend/` with FastAPI, Motor, Pydantic, and Firebase Admin SDK.
- [ ] Initialize `frontend/` with Next.js (App Router), Tailwind CSS, and Firebase Client SDK.
- [ ] Implement backend API endpoints mirroring current Supabase functionality.
- [ ] Port pages and components into Next.js.
- [ ] Connect Python-based resume parsing and AI matching service.
