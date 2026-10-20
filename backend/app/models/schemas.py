from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any

class EducationItem(BaseModel):
    id: Optional[str] = None
    institution: str = ""
    degree: str = ""
    field: str = ""
    year: str = ""

class StudentProfileModel(BaseModel):
    full_name: str = ""
    phone: str = ""
    location: str = ""
    experience: str = ""
    skills: List[str] = []
    interests: List[str] = []
    availability: List[str] = []
    preferred_job_types: List[str] = []
    education: List[EducationItem] = []
    resume_url: Optional[str] = None
    resume_name: Optional[str] = None

class UserSyncRequest(BaseModel):
    firebase_uid: str
    email: str
    full_name: Optional[str] = ""
    photo_url: Optional[str] = None
    auth_provider: Optional[str] = "google"

class LoginFallbackRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    firebase_uid: Optional[str] = None
    email: str
    full_name: str
    role: str
    auth_provider: str = "firebase"
    has_password: bool = False

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    required_skills: List[str] = []
    category: str = "Technology"
    job_type: str = "Internship"
    location: str = "Remote"
    remote: bool = False
    salary_or_stipend: str = ""
    eligibility: str = ""
    deadline: Optional[str] = None
    status: str = "active"

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    category: Optional[str] = None
    job_type: Optional[str] = None
    location: Optional[str] = None
    remote: Optional[bool] = None
    salary_or_stipend: Optional[str] = None
    eligibility: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = ""

class InterviewDetails(BaseModel):
    date: str = ""
    time: str = ""
    instructions: str = ""

class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None
    interview_details: Optional[InterviewDetails] = None
