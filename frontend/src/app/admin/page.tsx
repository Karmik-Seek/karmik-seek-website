'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Database
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import StatusBadge from '@/components/StatusBadge';
import MatchScore from '@/components/MatchScore';
import { LoadingSpinner, EmptyState } from '@/components/Feedback';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<{
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
    pending_reviews: number;
    total_users?: number;
    student_count?: number;
    admin_count?: number;
    recent_applications: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    api.getAdminStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (!user && authLoading) {
    return (
      <div className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8 animate-pulse" style={{ background: 'var(--color-cream-100)' }}>
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

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Banner */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-cream-300)' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-plum-700)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-plum-700)' }} /> Admin Control Center
            </div>
            <h1
              className="text-h2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Recruitment Overview
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Signed in as <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{user?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/jobs" className="btn btn-primary text-xs">
              <Plus size={15} /> Post New Role
            </Link>
            <Link href="/admin/applicants" className="btn btn-secondary text-xs">
              <Users size={15} /> Review Candidates
            </Link>
            <Link href="/admin/users" className="btn btn-secondary text-xs">
              <Users size={15} /> Manage Users & Admins
            </Link>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div
            className="glass rounded-[var(--radius-card)] p-5"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>Total Postings</span>
              <Briefcase size={18} style={{ color: 'var(--color-plum-700)' }} />
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-9 w-12 rounded bg-black/10 animate-pulse my-0.5" />
              ) : (
                <p
                  className="text-3xl font-medium tabular-nums"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                >
                  {stats?.total_jobs || 0}
                </p>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
              {stats?.active_jobs || 0} active listings
            </p>
          </div>

          <div
            className="glass rounded-[var(--radius-card)] p-5"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>Total Applicants</span>
              <Users size={18} style={{ color: 'var(--color-plum-500)' }} />
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-9 w-12 rounded bg-black/10 animate-pulse my-0.5" />
              ) : (
                <p
                  className="text-3xl font-medium tabular-nums"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                >
                  {stats?.total_applications || 0}
                </p>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
              Across all published roles
            </p>
          </div>

          <Link
            href="/admin/users"
            className="glass rounded-[var(--radius-card)] p-5 hover:shadow-lift transition-all block group"
            style={{
              border: '1px solid rgb(255 255 255 / 0.7)',
              borderLeft: '4px solid var(--color-plum-700)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-plum-700)' }}>Members Directory</span>
              <Users size={18} style={{ color: 'var(--color-plum-700)' }} />
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-9 w-12 rounded bg-black/10 animate-pulse my-0.5" />
              ) : (
                <p
                  className="text-3xl font-medium tabular-nums"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-plum-700)' }}
                >
                  {stats?.total_users || 0}
                </p>
              )}
            </div>
            <p className="text-xs mt-1 group-hover:underline" style={{ color: 'var(--color-ink-muted)' }}>
              {stats?.student_count || 0} students · {stats?.admin_count || 0} admins →
            </p>
          </Link>

          <div
            className="glass rounded-[var(--radius-card)] p-5"
            style={{
              border: '1px solid rgb(255 255 255 / 0.7)',
              borderLeft: '4px solid var(--color-gold-500)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-gold-700)' }}>Pending Review</span>
              <Clock size={18} style={{ color: 'var(--color-gold-600)' }} />
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-9 w-12 rounded bg-black/10 animate-pulse my-0.5" />
              ) : (
                <p
                  className="text-3xl font-medium tabular-nums"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold-700)' }}
                >
                  {stats?.pending_reviews || 0}
                </p>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
              Awaiting recruiter action
            </p>
          </div>

          <div
            className="glass rounded-[var(--radius-card)] p-5"
            style={{
              border: '1px solid rgb(255 255 255 / 0.7)',
              borderLeft: '4px solid var(--color-sage-600)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-sage-600)' }}>Database Engine</span>
              <Database size={18} style={{ color: 'var(--color-sage-600)' }} />
            </div>
            <p
              className="mt-2 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              MongoDB Atlas
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-sage-600)' }}>
              Synced & Operational
            </p>
          </div>
        </div>

        {/* Recent Applications Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              Recent Applications
            </h2>
            <Link
              href="/admin/applicants"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{ color: 'var(--color-plum-700)' }}
            >
              View full pipeline <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div
              className="glass rounded-[var(--radius-card)] p-6 space-y-4 animate-pulse"
              style={{ border: '1px solid var(--color-cream-300)' }}
            >
              <div className="h-10 bg-black/5 rounded-lg" />
              <div className="h-10 bg-black/5 rounded-lg" />
              <div className="h-10 bg-black/5 rounded-lg" />
            </div>
          ) : (!stats?.recent_applications || stats.recent_applications.length === 0) ? (
            <EmptyState
              icon={Users}
              title="No applications received yet"
              description="Applications submitted by students will appear in this feed with live match scores."
            />
          ) : (
            <div
              className="glass rounded-[var(--radius-card)] overflow-hidden divide-y"
              style={{
                borderColor: 'var(--color-cream-300)',
                border: '1px solid rgb(255 255 255 / 0.7)',
              }}
            >
              {stats.recent_applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 transition-colors hover:bg-black/[0.02]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                        {app.student_name || app.student_email}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>applied for</span>
                      <span className="font-semibold text-xs" style={{ color: 'var(--color-plum-700)' }}>
                        {app.job_title}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                      {app.student_email} · Applied on {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.match_score > 0 && <MatchScore score={app.match_score} size="sm" />}
                    <StatusBadge status={app.status} />
                    <Link
                      href={`/admin/applicants?job_id=${app.job_id}`}
                      className="btn btn-secondary text-xs px-3 py-1"
                    >
                      Review
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
