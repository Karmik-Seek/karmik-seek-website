# Kaarmik Seek — In-Depth UI & Feature Specification Document
**Document:** `UI_FEATURE_EXPLANATION.md`  
**Purpose:** Comprehensive architectural, visual, and interaction blueprint covering every user journey, screen layout, clickable target, state transition, and platform feature.

---

## 1. Executive Summary & Product Workflow

**Kaarmik Seek** is a student and early-career recruitment platform connecting university candidates with internships, entry-level jobs, and campus hiring drives.

### Core Value Drivers:
1. **Algorithmic Skill Matching:** Evaluates candidate profiles against job specifications in real time, calculating a 0–100% compatibility score with skill gap analysis.
2. **Transparent Application Tracking:** Eliminates candidate ambiguity with a multi-stage visual pipeline tracker (`Applied` ➔ `Shortlisted` ➔ `Interview Scheduled` ➔ `Selected` / `Rejected`).
3. **Structured Recruiter Operations:** Enables admins to manage job postings, review applicant dossiers, transition candidate stages, and dispatch interview invites with automated notifications.

---

## 2. End-to-End User Journeys

```
                    ┌────────────────────────────────────────┐
                    │          GUEST / VISITOR               │
                    └───────────────────┬────────────────────┘
                                        │
                         Lands on Home Page (`/`)
                                        │
                    ┌───────────────────┴────────────────────┐
                    ▼                                        ▼
          Browse Public Jobs (`/jobs`)            Sign In / Register (`/login`)
                    │                                        │
                    └───────────────────┬────────────────────┘
                                        │
                       Firebase Auth + MongoDB Sync
                                        │
                    ┌───────────────────┴────────────────────┐
                    ▼                                        ▼
             [STUDENT ROLE]                            [ADMIN ROLE]
                    │                                        │
     Candidate Dashboard (`/dashboard`)             Admin Suite (`/admin`)
                    │                                        │
      ┌─────────────┼─────────────┐               ┌──────────┼──────────┐
      ▼             ▼             ▼               ▼          ▼          ▼
Job Search    Applications    Profile/Dossier  Job Manage  Applicant  Email Logs
 (`/jobs`)  (`/applications`)  (`/profile`)   (`/admin/jobs`) Pipeline
```

---

## 3. Screen-by-Screen Detailed Layout & Interaction Breakdown

---

### Screen 1: Public Landing & Hero Hub (`/`)

#### 1. Layout & Visual Zones
- **Top Navigation Bar (`Navbar`):**
  - Left: Logo icon + "Kaarmik Seek" brand text.
  - Center: Navigation links (`Jobs`, `Applications`, `Dashboard` when authenticated).
  - Right: Auth controls — `Sign In` & `Get Started` (unauthenticated) OR User Avatar dropdown with name, email, profile link, and sign-out button (authenticated).
- **Hero Spotlight Zone:**
  - Trust pill: `Verified Campus Recruiting Platform`.
  - Main Headline: Clear value proposition for student career launch.
  - Subtitle: Clear explanation of AI matching, transparent timelines, and verified stipends.
  - Dual Action CTAs:
    - Primary CTA: `Explore Open Roles` (navigates to `/jobs`).
    - Secondary CTA: `Complete Profile` or `For Employers / Admin` (navigates to `/profile` or `/admin`).
  - Interactive Floating Preview Card: Real-time preview of an active job card showing dynamic match score (e.g. 94%), company tag, stipend badge, and matched skills.
- **Metrics Bar:**
  - `94%` Match Placement Accuracy
  - `1,200+` Verified Campus Roles
  - `48 Hours` Average Recruiter Response Time
- **Features & Value Pillars (3-Column Grid):**
  - *Card 1: Algorithmic Skill Matching* — Instant breakdown of matched skills vs missing skills.
  - *Card 2: Real-time Application Pipeline* — Visual progress tracker showing stages without email guessing.
  - *Card 3: Verified Direct Recruiter Connect* — Direct interview invites with video links and schedule alerts.
- **Featured Openings Section:**
  - Top 3 recent jobs with live match percentages and one-click apply triggers.
- **Footer:**
  - Platform links, documentation, student support, privacy, and copyright notice.

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| `Explore Open Roles` Button | Left Click | Smooth transition to `/jobs` with full search/filter rail. |
| `Get Started` Button | Left Click | Redirects to `/register` with redirect return parameter. |
| `Sign In` Button | Left Click | Redirects to `/login`. |
| Job Preview Card | Left Click | Navigates directly to role detail at `/jobs/[id]`. |
| User Profile Menu | Left Click | Toggles dropdown drawer with `Profile`, `Applications`, `Sign Out`. |

---

### Screen 2: Authentication Hub (`/login` & `/register`)

#### 1. Layout & Visual Zones
- **Dual Authentication Card:**
  - Brand header with welcome back subtitle.
  - **Single-Click Google OAuth Button:** High-visibility Google button with logo.
  - **Divider:** `Or continue with email`.
  - **Email & Password Form:**
    - Email address input (with email format validation).
    - Password input (with show/hide eye toggle).
    - "Forgot Password?" trigger link.
    - Submit Button: `Sign In to Account` with loading spinner during network requests.
  - **Footer Switch:** `Don't have an account? Sign Up` link.

#### 2. Registration-Specific Fields (`/register`)
- Full Name input.
- College / University input.
- Degree & Graduation Year selector.
- Password input with dynamic strength meter (Length, numbers, symbols).
- Terms and privacy checkbox toggle.

#### 3. Behind-the-Scenes Sync & Fallback Logic
1. Firebase client signs user in and generates ID token.
2. Token is transmitted to FastAPI endpoint `POST /api/auth/sync`.
3. Backend matches or provisions user document in MongoDB Atlas.
4. If Firebase has configuration or network errors, system automatically engages backend direct authentication fallback for the seeded admin (`prajwalganiga06@gmail.com`).
5. Auth state is broadcast to Next.js context; user is directed to `/dashboard` (or `/admin` if admin role).

---

### Screen 3: Candidate Central Dashboard (`/dashboard`)

#### 1. Layout & Visual Zones
- **Welcome & Readiness Banner:**
  - Candidate greeting: "Welcome back, {Name}".
  - **Profile Completion Gauge:** Progress meter (e.g. `80% Complete`).
  - Warning tag if missing resume or key skills: "Add your resume to unlock 100% accurate AI job matching."
  - Action button: `Complete Profile`.
- **Key Metrics Grid (4 Stat Cards):**
  - *Total Applications Sent* (Number badge).
  - *Under Review / Shortlisted* (Number badge).
  - *Interviews Scheduled* (High-priority badge).
  - *Offers Extended* (Success badge).
- **Recommended Roles Widget (High Match %):**
  - Ranked list of top 3 open jobs where candidate's match score is `>= 75%`.
  - Each item displays: Role Title, Company, Match Score pill, Deadline, and `Quick Apply` button.
- **Active Applications Snapshot:**
  - Table showing current job applications, date submitted, current stage badge, and action button `View Progress`.

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| `Complete Profile` Banner | Left Click | Opens `/profile` with focus on missing section (e.g., Resume upload). |
| Metric Card: `Interviews Scheduled` | Left Click | Redirects to `/applications` filtered to `Interviewing` tab. |
| `Quick Apply` on Recommended Job | Left Click | Opens Job Detail modal/page with pre-filled cover letter. |
| `View All Applications` Link | Left Click | Navigates to `/applications`. |

---

### Screen 4: Job Discovery & Filtering Hub (`/jobs`)

#### 1. Layout & Visual Zones
- **Top Search & Sort Bar:**
  - Search input: Live query filter by job title, company name, or keyword.
  - Sort dropdown: `Highest Match Score`, `Newest First`, `Application Deadline`.
- **Left Filter Rail / Filter Drawer:**
  - *Job Type Checkboxes:* `Internship`, `Full-time`, `Contract`.
  - *Work Mode Checkboxes:* `Remote`, `Hybrid`, `On-site`.
  - *Category Selector:* `Engineering / Technology`, `Design`, `Product`, `Data & AI`, `Marketing`.
  - *Stipend / Salary Range Slider.*
  - *Action:* `Reset Filters` button.
- **Job Results Column:**
  - Total jobs counter: `Showing 8 active campus openings`.
  - **Job Monolith Cards Grid:**
    - Header: Company logo avatar, Company name, Role title.
    - Badges row: Job type, Location/Remote pill, Stipend pill (e.g. `₹25,000 / month`).
    - **Dynamic AI Match Badge:** `88% Match` (emerald if >=75%, amber if >=50%, zinc if <50%).
    - Required skills tag list (highlighting candidate's matched skills in emerald).
    - Footer row: Application deadline date, `View Role & Match Breakdown` button.

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| Search Input Typing | Keyup (debounced 250ms) | Filters visible cards instantly without full page reload. |
| Checkbox Filter (e.g. `Remote`) | Toggle click | Re-queries job list; updates URL search params for shareability. |
| Job Monolith Card | Left Click | Navigates to `/jobs/[id]` to inspect detailed match breakdown. |
| `Reset Filters` Button | Left Click | Clears all checkboxes and restores default listing. |

---

### Screen 5: Job Detail & AI Match Evaluation Spec (`/jobs/[id]`)

#### 1. Layout & Visual Zones
- **Role Hero Header:**
  - Back navigation button: `← Back to Job Discovery`.
  - Role Title, Company Name, Location, Job Type badge, Posted date.
  - Stipend badge & Deadline countdown tag.
  - Primary Action Button: `Apply Now` (or `Application Submitted` badge if already applied).
- **Two-Column Split Layout:**
  - **Left Column (Role Specifications & Details):**
    - *About the Role:* Full description of duties and project responsibilities.
    - *Required Qualifications & Eligibility:* Degree requirements, minimum CGPA, batch year.
    - *Required Technical Stack & Skills:* List of core and optional skills.
    - *Perks & Benefits:* Certificate of completion, flexible hours, letter of recommendation.
  - **Right Column (Algorithmic Match Breakdown Card):**
    - Large Match Score circular gauge (e.g. `85% Match Fit`).
    - Match fit summary: *"Your profile is an exceptional match. You satisfy 4 out of 5 required skills."*
    - **Sub-Score Progress Meters:**
      - *Skills Fit:* `45 / 50 pts`
      - *Education & Eligibility:* `15 / 15 pts`
      - *Experience:* `8 / 10 pts`
      - *Availability & Schedule:* `12 / 15 pts`
      - *Location / Remote Compatibility:* `10 / 10 pts`
    - **Skills Comparison Chips:**
      - *Matched Skills (Green tags):* `Python`, `FastAPI`, `MongoDB`, `Git`.
      - *Missing / Recommended Skills (Gray tags):* `Docker`.
- **Application Drawer / Modal (Triggered by `Apply Now`):**
  - Job summary confirmation header.
  - Attached Resume indicator: Shows candidate's uploaded resume name (e.g., `Prajwal_Resume.pdf`) with option to replace.
  - Cover Letter text area (with helpful prompt: "Why are you interested in this role?").
  - Submit Button: `Confirm & Submit Application`.

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| `Apply Now` Button | Left Click | Opens Application Modal (or redirects to `/login` if guest). |
| Application Modal Submit | Left Click | Submits payload to `POST /api/applications`; captures match score snapshot in database; displays success toast; changes button to `Application Submitted`. |
| Missing Skill Tag | Click/Hover | Displays tooltip: *"Add this skill to your profile after gaining experience to boost match score."* |

---

### Screen 6: Candidate Application Tracker (`/applications`)

#### 1. Layout & Visual Zones
- **Header & Filter Tabs:**
  - Title: `My Applications & Hiring Pipeline`.
  - Status Filter Tabs: `All Applications`, `Active Pipeline`, `Interviews (1)`, `Archived`.
- **Live Interview Spotlight Alert (Conditional — displays when interview scheduled):**
  - High-visibility banner with ambient amber/emerald glow.
  - Details: Company name, Role, Scheduled Date & Time, Meeting Platform (`Google Meet` / `Zoom`).
  - Action button: `Join Meeting Room` (opens link in new tab) + `Add to Calendar`.
- **Visual Multi-Stage Pipeline Cards List:**
  Each application card contains:
  - Top Row: Company Name, Role Title, Date Applied, Current Status Badge.
  - **Interactive 4-Stage Visual Progress Stepper:**
    - Stage 1: `Applied` (Checked circle)
    - Stage 2: `Shortlisted` (Checked circle or active pulsing dot)
    - Stage 3: `Interview Scheduled` (Calendar icon or pending circle)
    - Stage 4: `Offer Extended / Decision` (Trophy icon / Final check)
  - **Recruiter Activity & Timeline Expander:**
    - Chronological log of changes:
      - *"Application received on Oct 18, 2026"*
      - *"Profile reviewed and shortlisted by Recruiter on Oct 19, 2026"*
      - *"Interview scheduled for Oct 22, 2026 at 11:00 AM IST"*
  - **Actions Row:**
    - `View Original Job Posting` link.
    - `Withdraw Application` trigger button (prompts confirmation modal).

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| Filter Tab `Interviews` | Left Click | Filters card list to only applications with status `INTERVIEW_SCHEDULED`. |
| `Join Meeting Room` | Left Click | Launches meeting URL in new tab. |
| Timeline Accordion Toggle | Left Click | Expands/collapses audit trail of recruiter notes and timestamps. |
| `Withdraw Application` | Left Click | Opens confirmation modal; on confirmation calls `PATCH /api/applications/{id}/withdraw`; transitions status to `WITHDRAWN`. |

---

### Screen 7: Candidate Profile Dossier & Resume Center (`/profile`)

#### 1. Layout & Visual Zones
- **Profile Summary Header:**
  - Avatar / Profile Photo upload.
  - Candidate Full Name, Email, Phone, Location.
  - Overall Profile Completion Percentage bar.
- **Section 1: Resume Document Manager:**
  - Drag-and-drop file upload zone (accepts `.pdf`, `.docx` up to 5MB).
  - Active file card showing: File name, upload timestamp, file size, `Download` icon, and `Remove` button.
  - Auto-Parser Badge: *"Resume parsed: 12 skills automatically indexed."*
- **Section 2: Technical & Soft Skills Matrix:**
  - Searchable skill input field with autocomplete suggestions.
  - Interactive skill tags with `×` remove buttons.
  - "Popular Skills for Your Major" suggested tags with single-click add.
- **Section 3: Education History Matrix:**
  - List of added educational records (Institution, Degree, Major, Graduation Year, CGPA/Score).
  - `+ Add Education` modal form.
- **Section 4: Work Experience & Projects:**
  - Project Title, Description, Technologies used, GitHub/Live Demo links.
- **Section 5: Account & Password Security:**
  - Linked auth providers (`Google`, `Password`).
  - "Set Account Password" or "Change Password" trigger (Firebase password integration).

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| Resume Dropzone | Drag File / Click | Validates file size & MIME type; uploads to storage; re-runs match calculations. |
| Add Skill Tag | Enter key or click | Appends skill to profile array; updates match scores across all active jobs. |
| `+ Add Education` | Left Click | Opens modal; adds structured education item; increments profile completion. |
| `Save Profile Changes` | Left Click | Sends `PUT /api/student/profile`; shows success feedback toast. |

---

### Screen 8: Admin & Placement Management Suite (`/admin`)

#### 1. Layout & Sub-Pages
- **Sub-Page 1: Admin Overview (`/admin`):**
  - KPI Cards: Total Live Jobs, Total Candidates Registered, Active Applications in Pipeline, Placement Rate %.
  - Quick action buttons: `+ Post New Job`, `View Pending Applicants`.
- **Sub-Page 2: Job Openings Manager (`/admin/jobs`):**
  - Table of all posted jobs with status toggle (`Active` / `Closed`).
  - Action menu: `Edit Job`, `View Applicants for Role`, `Close Job`.
  - **Create / Edit Job Modal:**
    - Form fields: Title, Company, Category, Job Type, Location, Stipend/Salary, Deadline, Required Skills tag input, Eligibility criteria, Full job description markdown.
- **Sub-Page 3: Applicant Pipeline & Kanban (`/admin/applicants`):**
  - Role Filter dropdown: Select specific job opening to review applicants.
  - Pipeline Column / Table View with status columns:
    - `Applied` | `Shortlisted` | `Interview Scheduled` | `Selected` | `Rejected`
  - **Applicant Dossier Preview Modal (When clicking applicant name):**
    - Full profile display: Education, CGPA, verified skills, cover letter, resume PDF preview.
    - Algorithmic match score indicator.
    - **One-Click Stage Action Controls:**
      - Button: `Promote to Shortlisted`
      - Button: `Schedule Interview` (Opens modal to input Date, Time, Meeting Link, and Candidate Notes)
      - Button: `Extend Offer / Select`
      - Button: `Reject with Feedback`
    - Automated Email Dispatch toggle: Automatically notifies candidate of their stage transition.

#### 2. User Interactions & Click Matrix
| Target Element | Click Action | System Response |
| :--- | :--- | :--- |
| `+ Post New Job` Button | Left Click | Opens job creator modal; saves to `jobs` collection in MongoDB. |
| `Schedule Interview` on Applicant | Left Click | Opens scheduling modal; inputs meeting link & date; transitions application to `INTERVIEW_SCHEDULED`; dispatches template email to student. |
| Stage Filter Dropdown | Select change | Filters candidate table dynamically without page reload. |

---

## 4. Complete Feature Matrix & Logic Specifications

### 4.1 Algorithmic Match Scoring Formula
The match engine scores candidate profiles against job requirements on a **0–100 scale**:

$$\text{Total Score} = S_{\text{skills}} + S_{\text{education}} + S_{\text{experience}} + S_{\text{availability}} + S_{\text{location}}$$

| Factor | Weight | Evaluation Logic |
| :--- | :--- | :--- |
| **Skills Fit** | **50%** | $\frac{\text{Count of matched required skills}}{\text{Total required skills}} \times 50$ (Normalized with synonyms) |
| **Education Fit** | **15%** | Matches degree/field requirement and minimum graduation year |
| **Experience** | **10%** | Relevant internship or project work listed in dossier |
| **Availability** | **15%** | Candidate schedule matches job requirement (`Full-time`, `Part-time`, `Summer`) |
| **Location / Remote** | **10%** | Exact city match OR job is marked `Remote` |

### 4.2 Application Status State Machine
Strict transitions enforced by the FastAPI backend to ensure pipeline integrity:
```
           ┌──────────┐
           │ APPLIED  │
           └────┬─────┘
                │
         ┌──────┴──────┐
         ▼             ▼
   ┌───────────┐  ┌──────────┐
   │SHORTLISTED│  │ REJECTED │
   └─────┬─────┘  └──────────┘
         │
         ▼
┌──────────────────┐
│INTERVIEW_SCHEDULE│
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│SELECTED│ │REJECTED│
└────────┘ └────────┘
```
*(Candidates may set `WITHDRAWN` from any non-final stage).*

### 4.3 Email & Notification Event Triggers
1. **Welcome Email:** Dispatched on initial registration and MongoDB account provisioning.
2. **Application Confirmation:** Dispatched to candidate immediately upon submitting a job application.
3. **Shortlist Notification:** Sent when recruiter advances candidate to `SHORTLISTED`.
4. **Interview Invitation:** Dispatched when recruiter schedules an interview; includes date, time, platform link, and preparation tips.
5. **Selection / Offer Letter:** Dispatched when candidate is marked `SELECTED`.

---

## 5. Summary & Next Steps

This document outlines the entire functional scope, user interactions, and visual requirements for Kaarmik Seek.

> **Next Step:** Please share your specific UI reference, wireframes, screenshots, or design assets. With this comprehensive feature map in place, the entire user interface will be built to match your exact visual standard.
