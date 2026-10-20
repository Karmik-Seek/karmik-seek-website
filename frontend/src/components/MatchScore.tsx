'use client';

import React from 'react';
import { Sparkles, Check, Plus } from 'lucide-react';
import type { MatchExplanation } from '@/lib/types';

interface MatchScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function MatchScore({ score, size = 'md', showLabel = true }: MatchScoreProps) {
  const getTier = (s: number) => {
    if (s >= 75) {
      return {
        bg: 'var(--color-sage-100)',
        text: 'var(--color-sage-600)',
        border: 'rgba(62, 123, 91, 0.35)',
        bar: 'var(--color-sage-600)',
      };
    }
    if (s >= 50) {
      return {
        bg: 'var(--color-gold-100)',
        text: 'var(--color-gold-700)',
        border: 'rgba(199, 160, 90, 0.4)',
        bar: 'var(--color-gold-600)',
      };
    }
    return {
      bg: 'var(--color-grey-100)',
      text: 'var(--color-grey-600)',
      border: 'rgba(157, 151, 146, 0.35)',
      bar: 'var(--color-grey-500)',
    };
  };

  const t = getTier(score);

  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
        style={{
          background: t.bg,
          color: t.text,
          border: `1px solid ${t.border}`,
        }}
        aria-label={`Match score ${score} percent`}
      >
        <Sparkles size={11} />
        {score}%
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
      style={{
        background: t.bg,
        color: t.text,
        border: `1px solid ${t.border}`,
      }}
      aria-label={`Match score ${score} percent`}
    >
      <Sparkles size={15} />
      <span>{score}%</span>
      {showLabel && (
        <span className="text-xs font-medium opacity-80">Match</span>
      )}
    </div>
  );
}

export function MatchExplanationView({
  explanation,
  score,
}: {
  explanation: MatchExplanation;
  score: number;
}) {
  const breakdown = explanation.breakdown || {
    skills: 0,
    education: 0,
    experience: 0,
    availability: 0,
    location: 0,
  };

  return (
    <div
      className="glass rounded-[var(--radius-card)] p-6 space-y-5"
      style={{ border: '1px solid rgb(255 255 255 / 0.75)' }}
    >
      <div
        className="flex items-center justify-between pb-3 border-b"
        style={{ borderColor: 'var(--color-cream-300)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Match Breakdown
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              5-dimensional algorithmic scoring
            </p>
          </div>
        </div>
        <MatchScore score={score} size="md" />
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
        {explanation.summary}
      </p>

      {/* Breakdown progress bars */}
      <div className="space-y-3 pt-1">
        {[
          { label: 'Skills Fit', val: breakdown.skills, max: 50 },
          { label: 'Education & Eligibility', val: breakdown.education, max: 15 },
          { label: 'Experience Alignment', val: breakdown.experience, max: 10 },
          { label: 'Availability & Job Type', val: breakdown.availability, max: 15 },
          { label: 'Location & Remote Fit', val: breakdown.location, max: 10 },
        ].map(({ label, val, max }) => {
          const pct = Math.min(100, Math.round((val / max) * 100));
          return (
            <div key={label}>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span style={{ color: 'var(--color-ink)' }}>{label}</span>
                <span className="tabular-nums font-semibold" style={{ color: 'var(--color-plum-700)' }}>
                  {val} / {max} pts
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full overflow-hidden"
                style={{ background: 'var(--color-cream-200)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, var(--color-plum-700), var(--color-wine-700))',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills comparison tags */}
      <div
        className="pt-4 border-t"
        style={{ borderColor: 'var(--color-cream-300)' }}
      >
        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <span
              className="font-semibold flex items-center gap-1 mb-2"
              style={{ color: 'var(--color-sage-600)' }}
            >
              <Check size={14} /> Matched Skills ({explanation.matched_skills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {explanation.matched_skills.length === 0 ? (
                <span className="text-xs italic" style={{ color: 'var(--color-ink-muted)' }}>
                  None yet
                </span>
              ) : (
                explanation.matched_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: 'var(--color-sage-100)',
                      color: 'var(--color-sage-600)',
                      border: '1px solid rgba(62, 123, 91, 0.3)',
                    }}
                  >
                    <Check size={11} /> {s}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <span
              className="font-semibold flex items-center gap-1 mb-2"
              style={{ color: 'var(--color-grey-600)' }}
            >
              <Plus size={14} /> Missing Skills ({explanation.missing_skills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {explanation.missing_skills.length === 0 ? (
                <span className="text-xs font-semibold" style={{ color: 'var(--color-sage-600)' }}>
                  All required skills matched!
                </span>
              ) : (
                explanation.missing_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      background: 'var(--color-grey-100)',
                      color: 'var(--color-grey-600)',
                      border: '1px solid var(--color-cream-300)',
                    }}
                  >
                    <Plus size={11} /> {s}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
