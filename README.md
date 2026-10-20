# karmik-seek-website — Kaarmik Seek Platform

**Kaarmik Seek** is an AI-powered campus recruitment platform:
* **Frontend:** Next.js (App Router, TypeScript, Vanilla & Modern CSS) in `frontend/`
* **Backend:** FastAPI (Python 3.11+, asynchronous REST API) in `backend/`
* **Database:** MongoDB Atlas
* **Email Service:** Gmail SMTP with automated templated notifications
* **Authentication:** Firebase Authentication & Fallback JWT

---

## 🚀 Running the Project Locally

### 1. Backend (FastAPI + MongoDB Atlas)
```bash
cd backend
# Run server
uvicorn app.main:app --reload --port 8000
```
* **API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Keep-Alive Ping Endpoint:** [http://localhost:8000/ping](http://localhost:8000/ping)
* **Database:** Connects to MongoDB Atlas `karmik_seek` database.
* **Admin Configuration:**
  * Configured securely via `.env` (`ADMIN_EMAILS`, `ADMIN_DEFAULT_PASSWORD`).

---

### 2. Frontend (Next.js)
```bash
cd frontend
# Run Next.js development server
npm run dev
```
* **Web App URL:** [http://localhost:3000](http://localhost:3000)

---

## ✨ Upgraded Features & Capabilities

1. **Authentication:**
   * **One-Click Google Sign-In** using Firebase Client SDK.
   * **Direct Email/Password Authentication** with instant user provisioning into MongoDB.
   * **Forgot Password Link:** Users can request an official Firebase password reset link sent directly to their email.
   * **Pre-Seeded Admin:** `prajwalganiga06@gmail.com` has administrator privileges guaranteed across all endpoints.

2. **Student Experience:**
   * **Profile Management:** Contact details, education matrix, skill tags, availability, and PDF/Word resume uploads up to 5 MB.
   * **Dashboard:** Real-time count of total applications, reviews, shortlists, interviews, and selections.
   * **Job Discovery:** Keyword search, category filters, job types, and remote filter.
   * **Server-Side AI Match Scoring:** Evaluates fit percentage, matched skills vs. missing skills, and detailed point breakdowns (Skills 50%, Education 15%, Experience 10%, Availability 15%, Location 10%).
   * **My Applications Tracker:** Expandable status history timeline and interview schedules with meeting links.

3. **Admin Recruitment Control:**
   * **Dashboard Analytics:** Real-time stats across job openings and applicant pipelines.
   * **Job Management:** Create, edit, toggle active/closed, and delete job openings.
   * **Applicant Pipeline:** Review student qualifications, download resumes, change candidate status (`APPLIED` → `SHORTLISTED` → `INTERVIEW_SCHEDULED` → `SELECTED` / `REJECTED`), and schedule interviews with date, time, and instructions.
