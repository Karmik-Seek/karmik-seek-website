import datetime
from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGODB_URI)
db = client[settings.DATABASE_NAME]

def get_db():
    return db

def init_db_and_seed():
    """Initializes indexes and seeds the required admin user and sample job listings."""
    # Ensure indexes
    db.users.create_index("email", unique=True)
    db.users.create_index("firebase_uid", unique=True, sparse=True)
    db.student_profiles.create_index("email", unique=True)
    db.student_profiles.create_index("user_id")
    db.applications.create_index([("student_id", 1), ("job_id", 1)], unique=True)
    db.jobs.create_index("status")

    # 1. Seed / Ensure Admin users
    admin_seeds = [
        {"email": "prajwalganiga06@gmail.com", "full_name": "Prajwal Admin"},
        {"email": "testathri@gmail.com", "full_name": "Athri Admin"},
    ]
    now = datetime.datetime.now(datetime.timezone.utc)

    for admin_info in admin_seeds:
        admin_email = admin_info["email"]
        existing = db.users.find_one({"email": admin_email})
        if not existing:
            db.users.insert_one({
                "email": admin_email,
                "full_name": admin_info["full_name"],
                "role": "admin",
                "auth_provider": "password",
                "has_password": True,
                "created_at": now,
                "updated_at": now,
            })
            print(f"[OK] Seeded Admin User: {admin_email} with role 'admin'")
        else:
            db.users.update_one(
                {"email": admin_email},
                {"$set": {"role": "admin", "has_password": True, "updated_at": now}}
            )
            print(f"[OK] Verified Admin User: {admin_email} has role 'admin'")

    # 2. Seed Sample Jobs if none exist
    if db.jobs.count_documents({}) == 0:
        sample_jobs = [
            {
                "title": "Full Stack Developer Intern",
                "company": "Nexus Technologies",
                "description": "We are seeking a proactive student intern proficient in React, Next.js, and Python/FastAPI. You will build user-facing features, integrate REST APIs, and write modular code.",
                "required_skills": ["React", "TypeScript", "Python", "FastAPI", "MongoDB"],
                "category": "Technology",
                "job_type": "Internship",
                "location": "Bengaluru (Hybrid)",
                "remote": True,
                "salary_or_stipend": "₹25,000 / month",
                "eligibility": "B.Tech, BE, or MCA students graduating in 2026 or 2027.",
                "deadline": "2026-11-30T23:59:59Z",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            {
                "title": "Frontend Engineering Intern",
                "company": "Aurora Design Studio",
                "description": "Join our product design engineering team. Work directly with senior UI designers to craft smooth micro-interactions, responsive landing pages, and accessible web components.",
                "required_skills": ["React", "Next.js", "Tailwind CSS", "JavaScript", "HTML/CSS"],
                "category": "Design",
                "job_type": "Part-time",
                "location": "Remote",
                "remote": True,
                "salary_or_stipend": "₹18,000 / month",
                "eligibility": "Open to all enrolled university students with frontend project experience.",
                "deadline": "2026-12-15T23:59:59Z",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            {
                "title": "Junior Python & AI Data Analyst",
                "company": "Synthetix Labs",
                "description": "Looking for data-curious students to help clean datasets, test LLM evaluation prompts, and build lightweight automation pipelines using Python and Pandas.",
                "required_skills": ["Python", "Pandas", "Data Analysis", "SQL", "Machine Learning"],
                "category": "Research",
                "job_type": "Internship",
                "location": "Hyderabad / Remote",
                "remote": True,
                "salary_or_stipend": "₹22,000 / month",
                "eligibility": "Students in CS, Data Science, Math, or Engineering disciplines.",
                "deadline": "2026-11-20T23:59:59Z",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            {
                "title": "Digital Growth & Content Marketing Associate",
                "company": "Karmik Media",
                "description": "Drive student engagement across digital channels. Create technical blog posts, manage social media updates, and analyze traffic metrics for student recruitment campaigns.",
                "required_skills": ["Content Writing", "Social Media Marketing", "SEO", "Communication"],
                "category": "Marketing",
                "job_type": "Part-time",
                "location": "Remote",
                "remote": True,
                "salary_or_stipend": "₹15,000 / month",
                "eligibility": "Undergraduate students with excellent communication and writing skills.",
                "deadline": "2026-11-25T23:59:59Z",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            {
                "title": "Weekend Customer Experience Specialist",
                "company": "EduBridge Global",
                "description": "Ideal flexible weekend position for students. Provide chat and email support to onboarding university students, troubleshoot platform questions, and document feedback.",
                "required_skills": ["Customer Support", "Communication", "Problem Solving", "Documentation"],
                "category": "Administration",
                "job_type": "Weekend",
                "location": "Remote",
                "remote": True,
                "salary_or_stipend": "₹12,000 / month",
                "eligibility": "Any degree; must be available Saturdays and Sundays (flexible 6 hours/day).",
                "deadline": "2026-12-05T23:59:59Z",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
        ]
        db.jobs.insert_many(sample_jobs)
        print(f"[OK] Seeded {len(sample_jobs)} initial job opportunities into MongoDB Atlas!")
