'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Clock, Sparkles, Calendar,
  CheckCircle2, ArrowRight, AlertCircle, Briefcase
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Application, Job } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import JobCard from '@/components/JobCard';
import StatusBadge from '@/components/StatusBadge';

function StatTile({
  label, value, accent, loading = false,
}: { label: string; value?: number; accent?: string; loading?: boolean }) {
  return (
    <div
      className="glass rounded-[var(--radius-card)] p-5 text-center"
      style={{ border: '1px solid rgb(255 255 255 / 0.65)' }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </p>
      {loading ? (
        <div className="h-9 w-12 mx-auto rounded-lg bg-black/10 animate-pulse my-0.5" />
      ) : (
        <p
          className="text-3xl font-medium tabular-nums"
          style={{
            fontFamily: 'var(--font-display)',
            color: accent || 'var(--color-ink)',
          }}
        >
          {value ?? 0}
        </p>
      )}
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div
      className="glass rounded-[var(--radius-card)] p-6 space-y-4 animate-pulse"
      style={{ border: '1px solid rgb(255 255 255 / 0.65)' }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-black/10 rounded w-3/4" />
          <div className="h-3.5 bg-black/10 rounded w-1/2" />
        </div>
        <div className="h-7 w-16 bg-black/10 rounded-full" />
      </div>
      <div className="h-12 bg-black/5 rounded-lg" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-black/10 rounded w-1/3" />
        <div className="h-8 bg-black/10 rounded-xl w-24" />
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }

    // Parallel background fetch: jobs and applications load concurrently without blocking layout render
    Promise.all([
      api.getMyApplications().catch(() => []),
      api.getJobs().catch(() => []),
    ])
      .then(([apps, jobs]: [Application[], Job[]]) => {
        setApplications(apps);
        const sorted = [...jobs].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        setRecommendedJobs(sorted.slice(0, 3));
      })
      .finally(() => setDataLoading(false));
  }, [user, authLoading, router]);

  // Auth gate check
  if (!user && authLoading) {
    return (
      <div
        className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8 animate-pulse"
        style={{ background: 'var(--color-cream-100)' }}
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-10 w-64 bg-black/10 rounded-lg" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-black/5 rounded-[var(--radius-card)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const appliedCount = applications.length;
  const underReviewCount = applications.filter((a) => a.status === 'APPLIED').length;
  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length;
  const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;

  const isProfileIncomplete =
    !profile?.resume_url ||
    (profile?.skills?.length || 0) === 0 ||
    (profile?.education?.length || 0) === 0;

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-7xl space-y-8">

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
              Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
              Track your applications and discover new matched roles.
            </p>
          </div>
          <Link href="/jobs" className="btn btn-primary text-sm self-start sm:self-auto">
            <Briefcase size={15} /> Browse roles
          </Link>
        </div>

        {/* Profile incomplete banner */}
        {!dataLoading && isProfileIncomplete && (
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[var(--radius-card)] p-5"
            style={{
              background: 'var(--color-gold-100)',
              border: '1px solid var(--color-gold-200)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--color-gold-700)' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Your profile is incomplete
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                  Upload your resume and add your skills to improve your match scores.
                </p>
              </div>
            </div>
            <Link href="/profile" className="btn btn-primary text-sm shrink-0">
              Complete profile
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile label="Total applied" value={appliedCount} loading={dataLoading} />
          <StatTile label="Under review" value={underReviewCount} accent="var(--color-plum-700)" loading={dataLoading} />
          <StatTile label="Shortlisted" value={shortlistedCount} accent="var(--color-plum-700)" loading={dataLoading} />
          <StatTile label="Interviews" value={interviewCount} accent="var(--color-gold-700)" loading={dataLoading} />
          <div className="col-span-2 sm:col-span-1">
            <StatTile label="Offers" value={selectedCount} accent="var(--color-sage-600)" loading={dataLoading} />
          </div>
        </div>

        {/* Recommended jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              Recommended for you
            </h2>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: 'var(--color-plum-700)' }}
            >
              Browse all <ArrowRight size={14} />
            </Link>
          </div>
          {dataLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-[var(--radius-card)] p-8 text-center text-sm"
              style={{
                background: 'var(--color-cream-50)',
                border: '1px solid var(--color-cream-300)',
                color: 'var(--color-ink-muted)',
              }}
            >
              Complete your profile to see matched roles.{' '}
              <Link href="/profile" style={{ color: 'var(--color-plum-700)' }} className="font-medium hover:underline">
                Add your skills →
              </Link>
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              Recent applications
            </h2>
            <Link
              href="/applications"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: 'var(--color-plum-700)' }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {dataLoading ? (
            <div
              className="rounded-[var(--radius-card)] p-6 space-y-4 animate-pulse"
              style={{ border: '1px solid var(--color-cream-300)', background: 'var(--color-cream-50)' }}
            >
              <div className="h-10 bg-black/5 rounded-lg" />
              <div className="h-10 bg-black/5 rounded-lg" />
              <div className="h-10 bg-black/5 rounded-lg" />
            </div>
          ) : applications.length === 0 ? (
            <div
              className="rounded-[var(--radius-card)] p-8 text-center text-sm"
              style={{
                background: 'var(--color-cream-50)',
                border: '1.5px dashed var(--color-cream-300)',
                color: 'var(--color-ink-muted)',
              }}
            >
              No applications yet.{' '}
              <Link href="/jobs" style={{ color: 'var(--color-plum-700)' }} className="font-medium hover:underline">
                Browse open roles →
              </Link>
            </div>
          ) : (
            <div
              className="rounded-[var(--radius-card)] overflow-hidden"
              style={{ border: '1px solid var(--color-cream-300)', background: 'var(--color-cream-50)' }}
            >
              {applications.slice(0, 4).map((app, idx) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 transition-colors"
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--color-cream-300)' : undefined,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--color-plum-50)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {app.job?.title || 'Job Listing'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                      {app.job?.company || ''} · Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <Link
                      href="/applications"
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--color-plum-700)' }}
                    >
                      Track →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
