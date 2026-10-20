import type { Metadata } from 'next';
import Image from 'next/image';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/Toast';
import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { display, sans } from './fonts';

export const metadata: Metadata = {
  title: 'Kaarmik Seek — AI-Powered Campus Recruitment',
  description: 'Kaarmik Seek matches university students with internships, part-time roles, and campus hiring drives using intelligent skill-based scoring.',
  keywords: ['internship', 'student jobs', 'campus recruitment', 'AI matching', 'stipend jobs'],
  icons: {
    icon: '/k-logo.png',
    shortcut: '/k-logo.png',
    apple: '/k-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-dvh flex-col" style={{ background: 'var(--color-cream-100)' }}>
              <Suspense fallback={
                <header className="sticky top-0 z-50 h-16 border-b"
                  style={{ background: 'rgb(251 248 244 / 0.82)', borderColor: 'var(--color-cream-300)' }}
                />
              }>
                <Navbar />
              </Suspense>
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <footer
                className="border-t py-8"
                style={{
                  background: 'var(--color-cream-200)',
                  borderColor: 'var(--color-cream-300)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src="/k-logo.png"
                        alt="Kaarmik Seek"
                        width={22}
                        height={22}
                        className="object-contain"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                      <span className="font-display text-base font-medium" style={{ color: 'var(--color-plum-700)' }}>
                        Kaarmik Seek
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-grey-500)' }}>·</span>
                      <span className="text-sm">Campus Recruitment Platform</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <a href="/jobs" style={{ color: 'var(--color-ink-muted)' }} className="hover:underline">Browse Roles</a>
                      <a href="/register" style={{ color: 'var(--color-ink-muted)' }} className="hover:underline">Create Account</a>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-grey-500)' }}>
                      © 2026 Kaarmik Seek. Free for students.
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
