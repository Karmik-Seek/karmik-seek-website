'use client';

import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      style={{ color: 'var(--color-ink-muted)' }}
    >
      <Loader2
        className="h-8 w-8 animate-spin"
        style={{ color: 'var(--color-plum-700)' }}
      />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      role="alert"
      style={{
        background: 'var(--color-wine-100)',
        border: '1px solid rgb(95 33 71 / 0.2)',
        color: 'var(--color-wine-700)',
      }}
    >
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius-card)] px-6 py-14 text-center"
      style={{
        border: '1.5px dashed var(--color-cream-300)',
        background: 'var(--color-cream-50)',
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
      >
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--color-ink-muted)' }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary mt-5 text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
