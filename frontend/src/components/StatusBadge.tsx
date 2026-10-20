'use client';

import React from 'react';
import { CheckCircle2, Calendar, X, Circle } from 'lucide-react';
import type { ApplicationStatus } from '@/lib/types';

const statusConfig: Record<
  ApplicationStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  APPLIED: {
    label: 'Applied',
    cls: 'badge-applied',
    icon: <Circle size={10} />,
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    cls: 'badge-shortlisted',
    icon: <Circle size={10} />,
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    cls: 'badge-interview',
    icon: <Calendar size={10} />,
  },
  SELECTED: {
    label: 'Selected',
    cls: 'badge-selected',
    icon: <CheckCircle2 size={10} />,
  },
  REJECTED: {
    label: 'Rejected',
    cls: 'badge-rejected',
    icon: <X size={10} />,
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    cls: 'badge-withdrawn',
    icon: <Circle size={10} />,
  },
};

export default function StatusBadge({ status }: { status: ApplicationStatus | string }) {
  const cfg = statusConfig[status as ApplicationStatus] ?? {
    label: status,
    cls: 'badge-applied',
    icon: <Circle size={10} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
