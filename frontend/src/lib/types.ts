export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  firebase_uid?: string;
  email: string;
  full_name: string;
  role: UserRole;
  auth_provider: string;
  has_password?: boolean;
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface StudentProfile {
  _id?: string;
  id?: string;
  user_id?: string;
  email: string;
  full_name: string;
  phone: string;
  location: string;
  experience: string;
  skills: string[];
  interests: string[];
  availability: string[];
  preferred_job_types: string[];
  education: EducationItem[];
  resume_url?: string | null;
  resume_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  category: string;
  job_type: string;
  location: string;
  remote: boolean;
  salary_or_stipend: string;
  eligibility: string;
  deadline?: string | null;
  status: string;
  match_score?: number;
  match_explanation?: MatchExplanation;
  created_at?: string;
  updated_at?: string;
}

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface StatusHistoryEntry {
  status: string;
  note: string;
  changed_at: string;
}

export interface InterviewDetails {
  date: string;
  time: string;
  instructions: string;
}

export interface MatchExplanation {
  matched_skills: string[];
  missing_skills: string[];
  breakdown: {
    skills: number;
    education: number;
    experience: number;
    availability: number;
    location: number;
  };
  summary: string;
}

export interface Application {
  id: string;
  student_id: string;
  student_email: string;
  student_name: string;
  job_id: string;
  cover_letter?: string;
  status: ApplicationStatus;
  match_score: number;
  match_explanation?: MatchExplanation | null;
  interview_details?: InterviewDetails | null;
  status_history: StatusHistoryEntry[];
  created_at: string;
  updated_at: string;
  job?: Job;
  student_profile?: StudentProfile;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
  'WITHDRAWN',
];

export const JOB_CATEGORIES = [
  'Technology',
  'Marketing',
  'Content',
  'Design',
  'Retail',
  'Administration',
  'Research',
  'General',
];

export const JOB_TYPES = [
  'Part-time',
  'Internship',
  'Weekend',
  'Remote',
  'Freelance',
  'Temporary',
  'Contract',
];

export const AVAILABILITY_OPTIONS = [
  'Weekdays',
  'Weekends',
  'Evenings',
  'Full-time available',
  'Summer break',
  '3 months',
  '6 months',
];
