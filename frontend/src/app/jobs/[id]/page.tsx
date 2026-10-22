'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Sparkles,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Job, Application } from '@/lib/types';
import { MatchExplanationView } from '@/components/MatchScore';
import { LoadingSpinner, ErrorMessage } from '@/components/Feedback';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';

export default function JobDetailsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading role specification..." />}>
      <JobDetailsContent />
    </Suspense>
  );
}

function JobDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);

    Promise.all([
      api.getJob(jobId),
      user && user.role === 'student' ? api.getMyApplications().catch(() => []) : Promise.resolve([]),
    ])
      .then(([jobData, myApps]: [Job, Application[]]) => {
        setJob(jobData);
        if (myApps && myApps.some((a) => a.job_id === jobId)) {
          setHasApplied(true);
        }
      })
      .catch((err) => {
        setError(err.message || 'Job could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, [jobId, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }
    setApplying(true);
    try {
      await api.applyToJob(jobId, coverLetter);
      setHasApplied(true);
      setShowApplyModal(false);
      showToast('success', 'Application submitted successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8"
        style={{ background: 'var(--color-cream-100)' }}
      >
        <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
          <div className="h-4 w-28 bg-black/10 rounded" />
          <div className="grid gap-8 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div
                className="glass rounded-[var(--radius-card)] p-6 sm:p-8 space-y-6"
                style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-black/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-3/4 bg-black/15 rounded" />
                    <div className="h-4 w-1/2 bg-black/10 rounded" />
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 w-full bg-black/5 rounded" />
                  <div className="h-4 w-5/6 bg-black/5 rounded" />
                  <div className="h-4 w-2/3 bg-black/5 rounded" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div
                className="glass rounded-[var(--radius-card)] p-6 space-y-4"
                style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
              >
                <div className="h-5 w-32 bg-black/15 rounded" />
                <div className="h-10 w-full bg-black/10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ErrorMessage message={error || 'Job not found.'} />
        <Link href="/jobs" className="btn btn-secondary mt-4 inline-flex">
          Back to all jobs
        </Link>
      </div>
    );
  }

  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;
  const deadlineDays = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const urgentDeadline = deadlineDays !== null && deadlineDays <= 3 && deadlineDays >= 0;

  return (
    <div
      className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <ArrowLeft size={15} /> Back to all jobs
        </Link>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Main Content (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div
              className="glass rounded-[var(--radius-card)] p-6 sm:p-8 space-y-6"
              style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: 'var(--color-plum-100)',
                    color: 'var(--color-plum-700)',
                    border: '1px solid var(--color-plum-200)',
                  }}
                >
                  <Building2 size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide mb-1.5"
                    style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                  >
                    {job.category}
                  </span>
                  <h1
                    className="text-2xl sm:text-3xl font-medium leading-tight"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                  >
                    {job.title}
                  </h1>
                  <p className="text-base font-medium mt-1" style={{ color: 'var(--color-ink-muted)' }}>
                    {job.company}
                  </p>
                </div>
              </div>

              {/* Meta strip */}
              <div
                className="flex flex-wrap gap-4 py-3 border-y text-xs font-medium"
                style={{
                  borderColor: 'var(--color-cream-300)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} style={{ color: 'var(--color-plum-500)' }} />
                  <span>{job.remote ? 'Remote' : job.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase size={15} style={{ color: 'var(--color-plum-500)' }} />
                  <span>{job.job_type}</span>
                </div>
                {job.salary_or_stipend && (
                  <div className="font-semibold" style={{ color: 'var(--color-plum-700)' }}>
                    {job.salary_or_stipend}
                  </div>
                )}
                {job.deadline && (
                  <div
                    className="flex items-center gap-1.5"
                    style={{
                      color: isExpired
                        ? 'var(--color-wine-700)'
                        : urgentDeadline
                        ? 'var(--color-gold-700)'
                        : 'var(--color-ink-muted)',
                    }}
                  >
                    <Calendar size={15} />
                    <span>
                      {isExpired
                        ? 'Applications closed'
                        : urgentDeadline
                        ? `Closes in ${deadlineDays}d`
                        : `Apply by ${new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </span>
                  </div>
                )}
              </div>

              {/* About Role */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
                  About the Role
                </h2>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  {job.description}
                </div>
              </div>

              {/* Required Skills */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div
                  className="space-y-3 pt-4 border-t"
                  style={{ borderColor: 'var(--color-cream-300)' }}
                >
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          background: 'var(--color-plum-50)',
                          border: '1px solid var(--color-plum-200)',
                          color: 'var(--color-plum-700)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility */}
              {job.eligibility && (
                <div
                  className="space-y-2 pt-4 border-t"
                  style={{ borderColor: 'var(--color-cream-300)' }}
                >
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    Eligibility Criteria
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                    {job.eligibility}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar (Right col) */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Apply Action Card */}
            <div
              className="glass-strong rounded-[var(--radius-card)] p-6 space-y-4"
              style={{
                border: '1px solid rgb(255 255 255 / 0.82)',
                boxShadow: 'var(--shadow-lift)',
              }}
            >
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
                Application Status
              </h3>

              {hasApplied ? (
                <div
                  className="rounded-xl p-4 text-center space-y-2"
                  style={{
                    background: 'var(--color-sage-100)',
                    border: '1px solid rgba(62, 123, 91, 0.3)',
                  }}
                >
                  <CheckCircle2 className="mx-auto" size={26} style={{ color: 'var(--color-sage-600)' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-sage-600)' }}>
                    Application Submitted
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    Your application is actively under review by {job.company}.
                  </p>
                  <Link
                    href="/applications"
                    className="btn btn-secondary text-xs mt-2 w-full justify-center"
                  >
                    Track in Applications
                  </Link>
                </div>
              ) : isExpired ? (
                <div
                  className="rounded-xl p-4 text-center space-y-1"
                  style={{
                    background: 'var(--color-wine-100)',
                    border: '1px solid rgba(95, 33, 71, 0.25)',
                  }}
                >
                  <AlertCircle className="mx-auto" size={24} style={{ color: 'var(--color-wine-700)' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-wine-700)' }}>
                    Applications Closed
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    The submission deadline for this position has passed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                    Submit your verified student profile and academic dossier directly into the recruiter's active pipeline.
                  </p>
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push(`/login?next=/jobs/${jobId}`);
                      } else {
                        setShowApplyModal(true);
                      }
                    }}
                    className="btn btn-primary w-full justify-center py-3 text-sm font-semibold"
                  >
                    <Send size={15} /> Apply for this Role
                  </button>
                </div>
              )}
            </div>

            {/* AI Match Explanation */}
            {job.match_explanation ? (
              <MatchExplanationView
                explanation={job.match_explanation}
                score={job.match_score || 0}
              />
            ) : !user ? (
              <div
                className="glass rounded-[var(--radius-card)] p-5 text-center space-y-3"
                style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
              >
                <div
                  className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl"
                  style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                >
                  <Lock size={18} />
                </div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Personalized Match Score
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                  Sign in with your student account to see your real-time 5-factor match score for this role.
                </p>
                <Link
                  href={`/login?next=/jobs/${jobId}`}
                  className="btn btn-secondary text-xs w-full justify-center"
                >
                  Sign in to view match
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div
              className="w-full max-w-lg rounded-[var(--radius-panel)] p-6 sm:p-7 shadow-pop space-y-5"
              style={{
                background: 'var(--color-cream-50)',
                border: '1px solid var(--color-cream-300)',
              }}
            >
              <div
                className="flex items-start justify-between pb-3 border-b"
                style={{ borderColor: 'var(--color-cream-300)' }}
              >
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
                  >
                    Apply to {job.company}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                    Role: {job.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-sm p-1 rounded-lg hover:bg-black/5"
                  style={{ color: 'var(--color-grey-600)' }}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label
                    htmlFor="cover-letter"
                    className="block text-xs font-semibold mb-1"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    Note to Recruiter / Cover Letter (Optional)
                  </label>
                  <textarea
                    id="cover-letter"
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Briefly highlight your relevant projects, course work, and why you are excited about this role..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                <div
                  className="rounded-xl p-3.5 text-xs space-y-1"
                  style={{
                    background: 'var(--color-cream-100)',
                    border: '1px solid var(--color-cream-300)',
                    color: 'var(--color-ink-muted)',
                  }}
                >
                  <span className="font-semibold block" style={{ color: 'var(--color-ink)' }}>
                    Dossier Submission:
                  </span>
                  Your profile details, matched skills, and uploaded resume (
                  {profile?.resume_name ? (
                    <strong style={{ color: 'var(--color-plum-700)' }}>{profile.resume_name}</strong>
                  ) : (
                    <span className="italic">no resume attached yet</span>
                  )}
                  ) will be submitted automatically.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="btn btn-primary text-xs py-2 px-5"
                  >
                    {applying ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
