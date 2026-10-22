'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  Building2,
  GraduationCap,
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Application, Job, ApplicationStatus, InterviewDetails } from '@/lib/types';
import { APPLICATION_STATUSES } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import MatchScore, { MatchExplanationView } from '@/components/MatchScore';
import { LoadingSpinner, EmptyState } from '@/components/Feedback';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';

export default function AdminApplicantsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading applicants pipeline..." />}>
      <AdminApplicantsContent />
    </Suspense>
  );
}

function AdminApplicantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [applicants, setApplicants] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterJob, setFilterJob] = useState<string>(searchParams.get('job_id') || 'All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Selected candidate drawer/modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState<InterviewDetails>({
    date: '',
    time: '',
    instructions: '',
  });
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, jobsData] = await Promise.all([
        api.getAdminApplicants({
          job_id: filterJob !== 'All' ? filterJob : undefined,
          status: filterStatus !== 'All' ? filterStatus : undefined,
        }),
        api.getJobs(),
      ]);
      setApplicants(appsData);
      setJobs(jobsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace(user ? '/dashboard' : '/login');
      return;
    }
    loadData();
  }, [user, authLoading, filterJob, filterStatus]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus, note?: string) => {
    setUpdating(true);
    try {
      const updated = await api.updateApplicantStatus(appId, newStatus, note);
      setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
      showToast('success', `Candidate status updated to ${newStatus}`);
    } catch (err: any) {
      showToast('error', err.message || 'Status change failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setUpdating(true);
    try {
      const updated = await api.updateApplicantStatus(selectedApp.id, 'INTERVIEW_SCHEDULED', 'Interview scheduled', interviewForm);
      setApplicants((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
      setSelectedApp(updated);
      setShowInterviewModal(false);
      showToast('success', 'Interview scheduled and candidate notified!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to schedule interview');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner label="Loading applicants pipeline..." />;

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-cream-300)' }}
        >
          <div>
            <h1
              className="text-h2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Candidate Pipeline
            </h1>
            <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
              Review applicants, examine 5-factor match breakdowns, inspect dossiers, and advance candidates.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink-muted)' }}>
              Filter by Role
            </label>
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              className="input-field text-xs"
            >
              <option value="All">All Job Postings</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink-muted)' }}>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field text-xs"
            >
              <option value="All">All Statuses</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidate List */}
        {applicants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates found"
            description="There are no applications matching your current filter criteria."
          />
        ) : (
          <div
            className="glass rounded-[var(--radius-card)] overflow-hidden divide-y"
            style={{
              borderColor: 'var(--color-cream-300)',
              border: '1px solid rgb(255 255 255 / 0.7)',
            }}
          >
            {applicants.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-black/[0.02] cursor-pointer transition-colors"
                onClick={() => setSelectedApp(app)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                      {app.student_profile?.full_name || app.student_name || app.student_email}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    Applied for <span className="font-semibold" style={{ color: 'var(--color-plum-700)' }}>{app.job?.title || 'Job'}</span> · {app.job?.company}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                    {app.student_email} · Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {app.match_score > 0 && <MatchScore score={app.match_score} size="md" />}
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-3.5 py-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                    }}
                  >
                    Review Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Candidate Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-3xl rounded-[var(--radius-panel)] p-6 sm:p-7 shadow-pop space-y-6 my-auto max-h-[85vh] overflow-y-auto"
              style={{
                background: 'var(--color-cream-50)',
                border: '1px solid var(--color-cream-300)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-start justify-between pb-4 border-b"
                style={{ borderColor: 'var(--color-cream-300)' }}
              >
                <div>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                  >
                    Candidate for {selectedApp.job?.title}
                  </span>
                  <h2
                    className="text-2xl font-semibold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                  >
                    {selectedApp.student_profile?.full_name || selectedApp.student_name}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    {selectedApp.student_email} · {selectedApp.student_profile?.phone || 'No phone provided'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg hover:bg-black/5"
                  style={{ color: 'var(--color-grey-600)' }}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Status Bar & Transitions */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4"
                style={{
                  background: 'var(--color-cream-100)',
                  border: '1px solid var(--color-cream-300)',
                }}
              >
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                    Current Pipeline Status:
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={selectedApp.status} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedApp.id, 'SHORTLISTED', 'Candidate shortlisted by recruiter')}
                    disabled={updating}
                    className="btn btn-secondary text-xs px-3 py-1.5"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => setShowInterviewModal(true)}
                    disabled={updating}
                    className="btn btn-secondary text-xs px-3 py-1.5"
                    style={{
                      background: 'var(--color-gold-100)',
                      color: 'var(--color-gold-700)',
                      borderColor: 'var(--color-gold-200)',
                    }}
                  >
                    Schedule Interview
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApp.id, 'SELECTED', 'Candidate selected for offer')}
                    disabled={updating}
                    className="btn btn-primary text-xs px-3 py-1.5"
                    style={{
                      background: 'var(--color-sage-600)',
                      borderColor: 'var(--color-sage-600)',
                    }}
                  >
                    Select / Offer
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApp.id, 'REJECTED', 'Application rejected')}
                    disabled={updating}
                    className="btn btn-secondary text-xs px-3 py-1.5"
                    style={{ color: 'var(--color-wine-700)' }}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Match Score & Explanation */}
              {selectedApp.match_explanation && (
                <MatchExplanationView
                  explanation={selectedApp.match_explanation}
                  score={selectedApp.match_score}
                />
              )}

              {/* Resume & Profile */}
              <div
                className="glass rounded-xl p-5 space-y-4"
                style={{
                  border: '1px solid var(--color-cream-300)',
                  background: 'var(--color-cream-100)',
                }}
              >
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                  Student Credentials & Dossier
                </h3>

                {selectedApp.student_profile?.resume_url ? (
                  <div
                    className="flex items-center justify-between rounded-lg p-3.5"
                    style={{
                      border: '1px solid var(--color-cream-300)',
                      background: 'var(--color-cream-50)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={18} style={{ color: 'var(--color-plum-700)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {selectedApp.student_profile.resume_name || 'Resume Document'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await api.getApplicantResumeLink(selectedApp.id);
                          window.open(res.url, '_blank', 'noopener,noreferrer');
                        } catch (e: any) {
                          showToast('error', e.message || 'Failed to open applicant resume');
                        }
                      }}
                      className="btn btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Resume <ExternalLink size={12} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--color-ink-muted)' }}>
                    No resume document attached.
                  </p>
                )}

                {/* Skills */}
                {selectedApp.student_profile?.skills && selectedApp.student_profile.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-ink-muted)' }}>
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.student_profile.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            background: 'var(--color-plum-50)',
                            color: 'var(--color-plum-700)',
                            border: '1px solid var(--color-plum-200)',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {selectedApp.student_profile?.education && selectedApp.student_profile.education.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-ink-muted)' }}>
                      Education History
                    </h4>
                    <div className="space-y-1.5">
                      {selectedApp.student_profile.education.map((edu, idx) => (
                        <div key={idx} className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {edu.degree} in {edu.field}
                          </span>{' '}
                          — {edu.institution} ({edu.year})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApp.cover_letter && (
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--color-cream-300)' }}>
                    <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--color-ink-muted)' }}>
                      Candidate Cover Note
                    </h4>
                    <p
                      className="text-xs whitespace-pre-line p-3 rounded-lg"
                      style={{
                        background: 'var(--color-cream-50)',
                        border: '1px solid var(--color-cream-300)',
                        color: 'var(--color-ink)',
                      }}
                    >
                      {selectedApp.cover_letter}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showInterviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div
              className="w-full max-w-md rounded-[var(--radius-panel)] p-6 shadow-pop space-y-4"
              style={{
                background: 'var(--color-cream-50)',
                border: '1px solid var(--color-cream-300)',
              }}
            >
              <div
                className="flex items-start justify-between pb-3 border-b"
                style={{ borderColor: 'var(--color-cream-300)' }}
              >
                <h3
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
                >
                  Schedule Candidate Interview
                </h3>
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="p-1 rounded-lg hover:bg-black/5"
                  style={{ color: 'var(--color-grey-600)' }}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScheduleInterview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                    Interview Date
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewForm.date}
                    onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                    Interview Time (e.g. 2:00 PM IST)
                  </label>
                  <input
                    type="text"
                    required
                    value={interviewForm.time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                    placeholder="e.g. 14:00 IST / 2:30 PM"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                    Meeting Link & Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={interviewForm.instructions}
                    onChange={(e) => setInterviewForm({ ...interviewForm, instructions: e.target.value })}
                    placeholder="e.g. Google Meet link: https://meet.google.com/abc-defg-hij. Please keep your portfolio and project repository ready."
                    className="input-field text-xs resize-none"
                  />
                </div>

                <div
                  className="flex justify-end gap-2 pt-2 border-t"
                  style={{ borderColor: 'var(--color-cream-300)' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="btn btn-primary text-xs"
                  >
                    {updating ? 'Saving…' : 'Confirm & Schedule'}
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
