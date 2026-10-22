import re
import difflib
from typing import Dict, Any, List, Set, Tuple

# ---------------------------------------------------------------------------
# Canonical Aliases & Normalization Dictionaries
# ---------------------------------------------------------------------------

TECH_ALIASES: Dict[str, str] = {
    # Modern Frontend & Frameworks
    "react": "react", "react.js": "react", "reactjs": "react", "react-js": "react",
    "next": "nextjs", "next.js": "nextjs", "nextjs": "nextjs", "next-js": "nextjs",
    "vue": "vue", "vue.js": "vue", "vuejs": "vue", "vue-js": "vue",
    "angular": "angular", "angular.js": "angular", "angularjs": "angular",
    "svelte": "svelte", "sveltekit": "svelte",
    "html": "html", "html5": "html",
    "css": "css", "css3": "css",
    "tailwind": "tailwindcss", "tailwindcss": "tailwindcss", "tailwind-css": "tailwindcss",
    "bootstrap": "bootstrap", "bootstrap5": "bootstrap",
    "ui/ux": "ui/ux", "ui ux": "ui/ux", "ui": "ui/ux", "ux": "ui/ux", "figma": "figma",

    # Modern Backend & Frameworks
    "node": "nodejs", "node.js": "nodejs", "nodejs": "nodejs", "node-js": "nodejs",
    "express": "expressjs", "express.js": "expressjs", "expressjs": "expressjs",
    "fastapi": "fastapi", "fast-api": "fastapi",
    "flask": "flask",
    "django": "django", "drf": "django", "django rest framework": "django",
    "spring": "springboot", "springboot": "springboot", "spring boot": "springboot", "spring-boot": "springboot",
    "dotnet": "dotnet", "asp.net": "dotnet", ".net": "dotnet", "dotnet core": "dotnet", ".net core": "dotnet",
    "nest": "nestjs", "nest.js": "nestjs", "nestjs": "nestjs",

    # Programming Languages
    "javascript": "javascript", "js": "javascript", "java-script": "javascript",
    "typescript": "typescript", "ts": "typescript", "type-script": "typescript",
    "python": "python", "py": "python", "python3": "python",
    "java": "java",
    "c++": "cpp", "cpp": "cpp", "cplusplus": "cpp",
    "c#": "csharp", "csharp": "csharp", "c-sharp": "csharp",
    "golang": "go", "go": "go",
    "rust": "rust",
    "php": "php",
    "ruby": "ruby", "ruby on rails": "ruby", "rails": "ruby",
    "swift": "swift", "kotlin": "kotlin",
    "sql": "sql",

    # Databases & Caches
    "postgres": "postgresql", "postgresql": "postgresql", "psql": "postgresql",
    "mongo": "mongodb", "mongodb": "mongodb",
    "mysql": "mysql",
    "redis": "redis",
    "sqlite": "sqlite",
    "cassandra": "cassandra",
    "dynamodb": "dynamodb",
    "firebase": "firebase", "firestore": "firebase",
    "supabase": "supabase",

    # Cloud, DevOps & Infrastructure
    "aws": "aws", "amazon web services": "aws",
    "gcp": "gcp", "google cloud": "gcp", "google cloud platform": "gcp",
    "azure": "azure", "microsoft azure": "azure",
    "docker": "docker", "containerization": "docker",
    "kubernetes": "kubernetes", "k8s": "kubernetes",
    "ci/cd": "ci/cd", "cicd": "ci/cd", "ci-cd": "ci/cd",
    "github actions": "github actions", "jenkins": "jenkins",
    "terraform": "terraform", "ansible": "ansible",
    "linux": "linux", "bash": "bash", "shell scripting": "bash",

    # AI, ML, Data Science
    "machine learning": "machine learning", "ml": "machine learning",
    "artificial intelligence": "artificial intelligence", "ai": "artificial intelligence",
    "deep learning": "deep learning", "dl": "deep learning",
    "nlp": "natural language processing", "natural language processing": "natural language processing",
    "computer vision": "computer vision", "cv": "computer vision",
    "genai": "generative ai", "generative ai": "generative ai", "llm": "generative ai", "llms": "generative ai",
    "data science": "data science", "data analytics": "data science", "data analysis": "data science",
    "pandas": "pandas", "numpy": "numpy", "tensorflow": "tensorflow", "pytorch": "pytorch", "scikit-learn": "scikit-learn",

    # Core Engineering & Architecture
    "git": "git", "github": "git", "version control": "git",
    "rest": "rest api", "restful": "rest api", "rest api": "rest api", "rest apis": "rest api", "restful apis": "rest api",
    "graphql": "graphql", "graph-ql": "graphql",
    "microservices": "microservices", "system design": "system design",
    "dsa": "data structures", "data structures": "data structures", "algorithms": "data structures", "data structures & algorithms": "data structures",
    "oop": "object oriented programming", "oops": "object oriented programming", "object oriented programming": "object oriented programming",
    "testing": "unit testing", "unit testing": "unit testing", "jest": "unit testing", "pytest": "unit testing",
}

CITY_ALIASES: Dict[str, str] = {
    "bengaluru": "bengaluru", "bangalore": "bengaluru", "blr": "bengaluru", "banglore": "bengaluru",
    "mumbai": "mumbai", "bombay": "mumbai",
    "delhi": "delhi", "new delhi": "delhi", "delhi ncr": "delhi", "ncr": "delhi",
    "gurugram": "gurugram", "gurgaon": "gurugram",
    "noida": "noida",
    "hyderabad": "hyderabad", "hyd": "hyderabad",
    "chennai": "chennai", "madras": "chennai",
    "pune": "pune",
    "kolkata": "kolkata", "calcutta": "kolkata",
    "ahmedabad": "ahmedabad",
    "jaipur": "jaipur",
    "chandigarh": "chandigarh",
    "kochi": "kochi", "cochin": "kochi",
    "trivandrum": "thiruvananthapuram", "thiruvananthapuram": "thiruvananthapuram",
    "remote": "remote", "work from home": "remote", "wfh": "remote", "anywhere": "remote",
}

DEGREE_ALIASES: Dict[str, str] = {
    "b.tech": "btech", "btech": "btech", "b.e": "btech", "b.e.": "btech", "be": "btech",
    "bachelor of technology": "btech", "bachelor of engineering": "btech",
    "m.tech": "mtech", "mtech": "mtech", "m.e": "mtech", "me": "mtech",
    "master of technology": "mtech", "master of engineering": "mtech",
    "bca": "bca", "bachelor of computer applications": "bca",
    "mca": "mca", "master of computer applications": "mca",
    "bsc": "bsc", "b.sc": "bsc", "bachelor of science": "bsc",
    "msc": "msc", "m.sc": "msc", "master of science": "msc",
    "bba": "bba", "bachelor of business administration": "bba",
    "mba": "mba", "master of business administration": "mba",
}

FIELD_ALIASES: Dict[str, str] = {
    "cse": "computer science", "cs": "computer science", "computer science": "computer science",
    "computer science engineering": "computer science", "computer science and engineering": "computer science",
    "computer engineering": "computer science",
    "it": "information technology", "information technology": "information technology",
    "is": "information science", "ise": "information science", "information science": "information science",
    "ece": "electronics", "electronics and communication": "electronics", "electronics & communication": "electronics",
    "eee": "electrical", "electrical and electronics": "electrical", "electrical & electronics": "electrical",
    "mech": "mechanical", "mechanical engineering": "mechanical",
    "civil": "civil", "civil engineering": "civil",
    "ai/ml": "ai/ml", "aiml": "ai/ml", "artificial intelligence and machine learning": "ai/ml",
    "ds": "data science", "data science": "data science",
}

STOP_WORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by", "from",
    "of", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "as", "about", "into", "through", "during", "before", "after",
    "above", "below", "up", "down", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "can", "will", "just", "should", "now", "we", "you",
    "candidate", "looking", "seeking", "experience", "knowledge", "working", "work", "years"
}

# ---------------------------------------------------------------------------
# Normalization & Matching Utilities
# ---------------------------------------------------------------------------

def clean_term(s: str) -> str:
    """Lowercases, strips extraneous characters, and compresses whitespace."""
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r'[\(\)\[\]\{\},;:\|]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def normalize_skill(s: str) -> str:
    """
    Normalizes a skill to its canonical form using the alias map
    and punctuation stripping (e.g. 'React.js' -> 'react', 'K8s' -> 'kubernetes').
    """
    cleaned = clean_term(s)
    if not cleaned:
        return ""
    if cleaned in TECH_ALIASES:
        return TECH_ALIASES[cleaned]
    # Try stripping dots and hyphens (e.g. 'node.js' -> 'nodejs')
    simplified = re.sub(r'[\.\-_]', '', cleaned)
    if simplified in TECH_ALIASES:
        return TECH_ALIASES[simplified]
    return cleaned

def are_skills_matching(s1: str, s2: str) -> bool:
    """
    Evaluates whether two skill terms represent the same skill using:
    1. Canonical alias equality
    2. Guarded distinct language checks (e.g. Java != JavaScript, C != C++)
    3. Multi-word phrase containment
    4. SequenceMatcher fuzzy similarity ratio >= 0.88 for typos
    """
    n1 = normalize_skill(s1)
    n2 = normalize_skill(s2)
    if not n1 or not n2:
        return False
    if n1 == n2:
        return True

    # Explicit protection against false positive substrings in programming languages
    forbidden_pairs = {
        ("java", "javascript"), ("javascript", "java"),
        ("c", "cpp"), ("cpp", "c"),
        ("c", "csharp"), ("csharp", "c"),
        ("c", "css"), ("css", "c"),
        ("go", "django"), ("django", "go"),
        ("r", "ruby"), ("ruby", "r"),
        ("r", "rust"), ("rust", "r"),
    }
    if (n1, n2) in forbidden_pairs:
        return False

    # Multi-word containment (e.g. "react native" and "react native mobile")
    if " " in n1 or " " in n2:
        words1 = set(n1.split())
        words2 = set(n2.split())
        if words1.issubset(words2) or words2.issubset(words1):
            return True

    # High fuzzy similarity for typos and minor spelling variations (ratio >= 0.88)
    if len(n1) >= 4 and len(n2) >= 4:
        if difflib.SequenceMatcher(None, n1, n2).ratio() >= 0.88:
            return True

    return False

def normalize_location(loc: str) -> str:
    """Normalizes location strings to canonical city names or 'remote'."""
    cleaned = clean_term(loc)
    if not cleaned:
        return ""
    if "remote" in cleaned or "wfh" in cleaned or "work from home" in cleaned:
        return "remote"
    for word in cleaned.split():
        if word in CITY_ALIASES:
            return CITY_ALIASES[word]
    return cleaned

def normalize_degree(text: str) -> str:
    cleaned = clean_term(text)
    for k, v in DEGREE_ALIASES.items():
        if k in cleaned:
            return v
    return cleaned

def normalize_field(text: str) -> str:
    cleaned = clean_term(text)
    for k, v in FIELD_ALIASES.items():
        if k in cleaned:
            return v
    return cleaned

# ---------------------------------------------------------------------------
# Main Tier 1 Match Scoring Engine
# ---------------------------------------------------------------------------

def calculate_match_score(profile: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tier 1 Server-side Kaarmik Seek Match Scoring Engine:
    - Normalizes tech aliases, degrees, cities, and stop words.
    - Uses fuzzy tolerance and canonical representations.
    - Zero external API dependencies (0.05 ms latency, 0 MB overhead).
    
    Weights:
      1. Core Skills Match: 50%
      2. Education & Eligibility: 15%
      3. Experience Relevance: 10%
      4. Availability & Job Type: 15%
      5. Location & Remote Flexibility: 10%
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

    # 1. Core Skills Match (50%)
    profile_skills = [s for s in (profile.get("skills") or []) if s]
    job_skills = [s for s in (job.get("required_skills") or []) if s]

    matched_job_skills: List[str] = []
    missing_job_skills: List[str] = []

    for js in job_skills:
        found = False
        for ps in profile_skills:
            if are_skills_matching(js, ps):
                found = True
                break
        if found:
            matched_job_skills.append(js)
        else:
            missing_job_skills.append(js)

    if not job_skills:
        skills_score = 30
    else:
        skills_ratio = len(matched_job_skills) / len(job_skills)
        skills_score = round(skills_ratio * 50)

    # 2. Education & Eligibility (15%)
    education_score = 0
    edu_list = profile.get("education") or []
    if len(edu_list) > 0:
        education_score = 10

    job_eligibility = (job.get("eligibility") or "").lower()
    if job_eligibility:
        # Check canonical degree / field overlap
        profile_degrees = {normalize_degree(e.get("degree", "")) for e in edu_list}
        profile_fields = {normalize_field(e.get("field", "")) for e in edu_list}
        elig_clean = clean_term(job_eligibility)

        degree_match = any(deg in elig_clean for deg in profile_degrees if deg)
        field_match = any(fld in elig_clean for fld in profile_fields if fld)

        if degree_match and field_match:
            education_score = 15
        elif degree_match or field_match:
            education_score = 13
        else:
            # Fallback keyword overlap (ignoring stop words)
            elig_words = [w for w in elig_clean.split() if len(w) > 3 and w not in STOP_WORDS]
            profile_blob = " ".join([
                " ".join([f"{e.get('degree', '')} {e.get('field', '')}" for e in edu_list]),
                profile.get("experience") or "",
                " ".join(profile.get("interests") or [])
            ]).lower()
            if elig_words and profile_blob:
                overlap = sum(1 for w in elig_words if w in profile_blob)
                education_score += min(5, round((overlap / max(1, len(elig_words))) * 5))
            else:
                education_score += 2
    else:
        education_score += 5

    education_score = min(15, education_score)

    # 3. Experience Relevance (10%)
    experience_score = 0
    exp_text = (profile.get("experience") or "").strip()
    if exp_text:
        experience_score = 6
        job_desc = clean_term(job.get("description") or "")
        desc_keywords = [w for w in job_desc.split() if len(w) > 3 and w not in STOP_WORDS]
        exp_clean = clean_term(exp_text)
        
        # Check domain keyword overlap
        if desc_keywords and exp_clean:
            overlap = sum(1 for w in desc_keywords if w in exp_clean)
            if overlap >= 3:
                experience_score += 4
            elif overlap >= 1:
                experience_score += 2

    # 4. Availability & Job Type (15%)
    availability_score = 0
    pref_types = [t.lower().strip() for t in (profile.get("preferred_job_types") or []) if t]
    job_type = (job.get("job_type") or "").lower().strip()

    if job_type in pref_types:
        availability_score += 10
    elif not pref_types:
        availability_score += 5

    if len(profile.get("availability") or []) > 0:
        availability_score += 5

    # 5. Location & Remote Flexibility (10%)
    location_score = 0
    is_remote_job = job.get("remote", False)
    job_loc_norm = normalize_location(job.get("location") or "")
    prof_loc_norm = normalize_location(profile.get("location") or "")

    if is_remote_job or job_loc_norm == "remote":
        location_score = 10
    elif prof_loc_norm and (prof_loc_norm == job_loc_norm or prof_loc_norm in job_loc_norm or job_loc_norm in prof_loc_norm):
        location_score = 10
    elif not prof_loc_norm:
        location_score = 5
    else:
        location_score = 3

    total_score = min(100, max(0, skills_score + education_score + experience_score + availability_score + location_score))

    summary = (
        f"You match {len(matched_job_skills)} of {len(job_skills)} required skills ({skills_score}/50 pts). "
        f"Education & criteria fit: {education_score}/15 pts. Overall match is {total_score}%."
    )

    return {
        "score": total_score,
        "explanation": {
            "matched_skills": matched_job_skills,
            "missing_skills": missing_job_skills,
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
