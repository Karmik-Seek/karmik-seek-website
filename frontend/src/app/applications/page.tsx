'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Calendar,
  MapPin,
  Clock,
  Ban,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Video
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Application, ApplicationStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import MatchScore from '@/components/MatchScore';
import { LoadingSpinner, EmptyState } from '@/components/Feedback';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';

const PIPELINE_STEPS = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview' },
  { key: 'SELECTED', label: 'Offer' },
];

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'interview' | 'offers'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    api.getMyApplications()
      .then((data) => setApplications(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    setWithdrawingId(appId);
    try {
      await api.withdrawApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      showToast('success', 'Application withdrawn.');
    } catch (err: any) {
      showToast('error', err.message || 'Could not withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (authLoading || loading) return <LoadingSpinner label="Loading application tracking..." />;

  // Filter applications by tab
  const filteredApps = applications.filter((app) => {
    if (filterTab === 'active') return app.status === 'APPLIED' || app.status === 'SHORTLISTED';
    if (filterTab === 'interview') return app.status === 'INTERVIEW_SCHEDULED';
    if (filterTab === 'offers') return app.status === 'SELECTED';
    return true;
  });

  const getStepIndex = (status: ApplicationStatus) => {
    if (status === 'APPLIED') return 0;
    if (status === 'SHORTLISTED') return 1;
    if (status === 'INTERVIEW_SCHEDULED') return 2;
    if (status === 'SELECTED') return 3;
    return -1; // REJECTED or WITHDRAWN
  };

  return (
    <div className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8" style={{ background: 'var(--color-cream-100)' }}>

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-cream-300)' }}>
          <div>
            <h1 className="text-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Application tracker
            </h1>
            <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
              Real-time progress across every role you have applied to.
            </p>
          </div>
          <Link href="/jobs" className="btn btn-primary text-sm self-start sm:self-auto">
            Browse more roles
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--color-cream-300)' }}>
          {([
            { key: 'all', label: `All (${applications.length})` },
            { key: 'active', label: `In review (${applications.filter((a) => a.status === 'APPLIED' || a.status === 'SHORTLISTED').length})` },
            { key: 'interview', label: `Interviews (${applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length})` },
            { key: 'offers', label: `Offers (${applications.filter((a) => a.status === 'SELECTED').length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterTab(key)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
              style={
                filterTab === key
                  ? { background: 'var(--color-plum-700)', color: '#fff' }
                  : { color: 'var(--color-ink-muted)', background: 'transparent' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications in this view"
            description="Explore our curated student openings and apply to track your career journey."
            action={{
              label: 'Browse Student Openings',
              onClick: () => router.push('/jobs'),
            }}
          />
        ) : (
          <div className="space-y-6">
            {filteredApps.map((app) => {
              const isExpanded = expandedId === app.id;
              const currentStep = getStepIndex(app.status);
              const isTerminalNegative = app.status === 'REJECTED' || app.status === 'WITHDRAWN';

              return (
                <div
                  key={app.id}
                  className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-6"
                  style={{ border: '1px solid rgb(255 255 255 / 0.65)' }}
                >
                  {/* Top Bar: Company info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                      >
                        <Building2 size={22} />
                      </div>
                      <div>
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide mb-1"
                          style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                        >
                          {app.job?.category || 'Role'}
                        </span>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                          {app.job?.title || 'Job Opportunity'}
                        </h3>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                          {app.job?.company} · {app.job?.remote ? 'Remote' : app.job?.location} · Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {app.match_score > 0 && <MatchScore score={app.match_score} size="sm" />}
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  {/* Pipeline Stepper */}
                  {!isTerminalNegative && (
                    <div
                      className="rounded-xl p-5 space-y-3"
                      style={{ background: 'var(--color-cream-50)', border: '1px solid var(--color-cream-300)' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>Progress</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-plum-700)' }}>Stage {currentStep + 1} of 4</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {PIPELINE_STEPS.map((step, idx) => {
                          const isDone = currentStep >= idx;
                          const isCurrent = currentStep === idx;
                          return (
                            <div key={step.key} className="space-y-2 text-center">
                              <div
                                className="h-1.5 w-full rounded-full"
                                style={{
                                  background: isDone ? 'var(--color-plum-700)' : 'var(--color-cream-300)',
                                  opacity: isDone ? 1 : 0.6,
                                }}
                              />
                              <p
                                className="text-[11px] font-medium"
                                style={{
                                  color: isCurrent
                                    ? 'var(--color-plum-700)'
                                    : isDone
                                    ? 'var(--color-ink-muted)'
                                    : 'var(--color-grey-500)',
                                  fontWeight: isCurrent ? '700' : '500',
                                }}
                              >
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interview Banner */}
                  {app.status === 'INTERVIEW_SCHEDULED' && app.interview_details && (
                    <div
                      className="rounded-xl p-5 space-y-3"
                      style={{ background: 'var(--color-gold-100)', border: '1px solid var(--color-gold-200)' }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--color-gold-700)' }}>
                          <Calendar size={17} />
                          Interview scheduled
                        </div>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: 'var(--color-gold-500)', color: '#fff' }}
                        >
                          Action required
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div className="rounded-lg p-3" style={{ background: 'rgb(255 255 255 / 0.6)', border: '1px solid var(--color-gold-200)' }}>
                          <span className="text-xs block mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>Date</span>
                          <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{app.interview_details.date}</span>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'rgb(255 255 255 / 0.6)', border: '1px solid var(--color-gold-200)' }}>
                          <span className="text-xs block mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>Time</span>
                          <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{app.interview_details.time}</span>
                        </div>
                      </div>
                      {app.interview_details.instructions && (
                        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgb(255 255 255 / 0.6)', border: '1px solid var(--color-gold-200)', color: 'var(--color-ink-muted)' }}>
                          <span className="font-semibold block mb-1" style={{ color: 'var(--color-ink)' }}>Meeting link and notes:</span>
                          <p className="leading-relaxed">{app.interview_details.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected banner */}
                  {app.status === 'SELECTED' && (
                    <div
                      className="rounded-xl p-5 space-y-2"
                      style={{ background: 'var(--color-sage-100)', border: '1px solid rgb(62 123 91 / 0.25)' }}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--color-sage-600)' }}>
                        <CheckCircle2 size={18} />
                        Congratulations — you have been selected
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                        The employer has confirmed your selection. Expect onboarding details to follow.
                      </p>
                    </div>
                  )}

                  {/* Actions row */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t"
                    style={{ borderColor: 'var(--color-cream-300)' }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: 'var(--color-ink-muted)' }}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {isExpanded ? 'Hide history' : 'View history'}
                    </button>

                    <div className="flex items-center gap-3">
                      {app.status !== 'SELECTED' && app.status !== 'REJECTED' && app.status !== 'WITHDRAWN' && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                          className="btn btn-destructive text-sm"
                          style={{ minHeight: '34px', padding: '0.375rem 0.875rem' }}
                        >
                          <Ban size={13} />
                          {withdrawingId === app.id ? 'Withdrawing…' : 'Withdraw'}
                        </button>
                      )}

                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        style={{ color: 'var(--color-plum-700)' }}
                      >
                        View role <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* History Drawer */}
                  {isExpanded && (
                    <div
                      className="rounded-xl p-5 space-y-4"
                      style={{ background: 'var(--color-cream-50)', border: '1px solid var(--color-cream-300)' }}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                        Status history
                      </h4>
                      <div
                        className="space-y-4 pl-3 border-l-2"
                        style={{ borderColor: 'var(--color-plum-300)' }}
                      >
                        {app.status_history?.map((step, idx) => (
                          <div key={idx} className="relative pl-4 space-y-0.5">
                            <div
                              className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full"
                              style={{ background: 'var(--color-plum-700)' }}
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{step.status}</span>
                              <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                                {new Date(step.changed_at).toLocaleString()}
                              </span>
                            </div>
                            {step.note && <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>{step.note}</p>}
                          </div>
                        ))}
                      </div>
                      {app.cover_letter && (
                        <div className="pt-3 border-t" style={{ borderColor: 'var(--color-cream-300)' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-ink-muted)' }}>Your submitted note:</p>
                          <p
                            className="text-sm italic whitespace-pre-line rounded-lg p-3"
                            style={{ background: 'rgb(255 255 255 / 0.6)', border: '1px solid var(--color-cream-300)', color: 'var(--color-ink-muted)' }}
                          >
                            &ldquo;{app.cover_letter}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
