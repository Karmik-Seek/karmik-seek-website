import math
from typing import Dict, Any, List

def calculate_match_score(profile: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Server-side implementation of Kaarmik Seek match scoring.
    Weights:
      - Skills: 50%
      - Education/Eligibility: 15%
      - Experience: 10%
      - Availability & Job Type: 15%
      - Location & Remote: 10%
    """
    if not profile:
        return {
            "score": 0,
            "explanation": {
                "matched_skills": [],
                "missing_skills": job.get("required_skills", []),
                "breakdown": {"skills": 0, "education": 0, "experience": 0, "availability": 0, "location": 0},
                "summary": "Complete your profile to see your match score for this job."
            }
        }

    # 1. Skills (50%)
    profile_skills = [s.lower().strip() for s in (profile.get("skills") or []) if s]
    job_skills = [s.lower().strip() for s in (job.get("required_skills") or []) if s]
    
    matched = [s for s in job_skills if s in profile_skills]
    missing = [s for s in job_skills if s not in profile_skills]

    if not job_skills:
        skills_score = 30
    else:
        skills_ratio = len(matched) / len(job_skills)
        skills_score = round(skills_ratio * 50)

    # 2. Education / eligibility (15%)
    education_score = 0
    edu_list = profile.get("education") or []
    if len(edu_list) > 0:
        education_score = 10
    
    eligibility = (job.get("eligibility") or "").lower()
    if eligibility:
        profile_text = " ".join([
            " ".join([f"{e.get('degree', '')} {e.get('field', '')}" for e in edu_list]),
            profile.get("experience") or "",
            " ".join(profile.get("interests") or [])
        ]).lower()

        elig_words = [w for w in eligibility.replace(",", " ").split() if len(w) > 3]
        if elig_words and profile_text:
            overlap = sum(1 for w in elig_words if w in profile_text)
            education_score += min(5, round((overlap / max(1, len(elig_words))) * 5))
        else:
            education_score += 2
    else:
        education_score += 5

    # 3. Experience (10%)
    experience_score = 0
    exp_text = (profile.get("experience") or "").strip()
    if exp_text:
        experience_score = 6
        job_desc = (job.get("description") or "").lower()
        if any(w in exp_text.lower() for w in job_desc.split() if len(w) > 4):
            experience_score += 4

    # 4. Availability & Job Type (15%)
    availability_score = 0
    pref_types = [t.lower() for t in (profile.get("preferred_job_types") or [])]
    job_type = (job.get("job_type") or "").lower()
    if job_type in pref_types:
        availability_score += 10
    elif not pref_types:
        availability_score += 5
    
    if len(profile.get("availability") or []) > 0:
        availability_score += 5

    # 5. Location & Remote (10%)
    location_score = 0
    job_loc = (job.get("location") or "").lower()
    prof_loc = (profile.get("location") or "").lower()
    is_remote = job.get("remote", False)

    if is_remote:
        location_score = 10
    elif prof_loc and prof_loc in job_loc:
        location_score = 10
    elif not prof_loc:
        location_score = 5
    else:
        location_score = 3

    total_score = min(100, max(0, skills_score + education_score + experience_score + availability_score + location_score))

    summary = (
        f"You match {len(matched)} of {len(job_skills)} required skills ({skills_score}/50 pts). "
        f"Education & criteria fit: {education_score}/15 pts. Overall match is {total_score}%."
    )

    return {
        "score": total_score,
        "explanation": {
            "matched_skills": [s for s in (job.get("required_skills") or []) if s.lower().strip() in matched],
            "missing_skills": [s for s in (job.get("required_skills") or []) if s.lower().strip() in missing],
            "breakdown": {
                "skills": skills_score,
                "education": education_score,
                "experience": experience_score,
                "availability": availability_score,
                "location": location_score
            },
            "summary": summary
        }
    }
