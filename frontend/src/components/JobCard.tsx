'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Briefcase, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import type { Job } from '@/lib/types';

function MatchBadge({ score }: { score: number }) {
  const tier =
    score >= 75
      ? { cls: 'match-high', label: `${score}% match` }
      : score >= 50
      ? { cls: 'match-mid', label: `${score}% match` }
      : { cls: 'match-low', label: `${score}% match` };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.cls}`}
    >
      <Sparkles size={11} />
      {tier.label}
    </span>
  );
}

export default function JobCard({ job }: { job: Job }) {
  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

  const deadlineDays = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const urgentDeadline = deadlineDays !== null && deadlineDays <= 3 && deadlineDays >= 0;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group glass rounded-[var(--radius-card)] p-6 flex flex-col justify-between transition-all"
      style={{
        border: '1px solid rgb(255 255 255 / 0.65)',
        /* Hover lift handled inline via onMouseEnter/Leave is too complex; use CSS group hover */
      }}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Category chip */}
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide mb-2"
              style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
            >
              {job.category}
            </span>
            <h3
              className="text-base font-semibold leading-snug group-hover:underline"
              style={{ color: 'var(--color-ink)' }}
            >
              {job.title}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              {job.company}
            </p>
          </div>

          {/* Match badge */}
          {job.match_score !== undefined && job.match_score > 0 && (
            <div className="shrink-0 pt-0.5">
              <MatchBadge score={job.match_score} />
            </div>
          )}
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed line-clamp-2"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          {job.description}
        </p>

        {/* Skill tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.required_skills?.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: 'var(--color-plum-50)',
                border: '1px solid var(--color-plum-200)',
                color: 'var(--color-plum-700)',
              }}
            >
              {skill}
            </span>
          ))}
          {job.required_skills && job.required_skills.length > 4 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              +{job.required_skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-5 pt-4 border-t"
        style={{ borderColor: 'var(--color-cream-300)' }}
      >
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-3" style={{ color: 'var(--color-ink-muted)' }}>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {job.remote ? 'Remote' : job.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} />
            {job.job_type}
          </span>
          {job.salary_or_stipend && (
            <span className="font-semibold" style={{ color: 'var(--color-plum-700)' }}>
              {job.salary_or_stipend}
            </span>
          )}
        </div>

        {/* Deadline + CTA */}
        <div className="flex items-center justify-between">
          {job.deadline ? (
            <span
              className="flex items-center gap-1 text-xs"
              style={{
                color: isExpired
                  ? 'var(--color-wine-700)'
                  : urgentDeadline
                  ? 'var(--color-gold-700)'
                  : 'var(--color-ink-muted)',
              }}
            >
              <Calendar size={11} />
              {isExpired
                ? 'Deadline passed'
                : urgentDeadline
                ? `${deadlineDays}d left to apply`
                : `Apply by ${new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </span>
          ) : (
            <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Open application
            </span>
          )}

          <span
            className="inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
            style={{ color: 'var(--color-plum-700)' }}
          >
            View role <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
