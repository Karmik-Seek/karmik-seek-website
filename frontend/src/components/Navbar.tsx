'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';

  const navLinks = user
    ? isAdmin
      ? [
          { href: '/admin', label: 'Overview' },
          { href: '/admin/jobs', label: 'Jobs' },
          { href: '/admin/applicants', label: 'Applicants' },
          { href: '/admin/users', label: 'Users & Admins' },
        ]
      : [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/jobs', label: 'Find Roles' },
          { href: '/applications', label: 'Applications' },
          { href: '/profile', label: 'Profile' },
        ]
    : [{ href: '/jobs', label: 'Browse Roles' }];

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ background: 'rgb(251 248 244 / 0.82)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)', borderBottom: '1px solid rgb(255 255 255 / 0.82)', boxShadow: '0 1px 0 rgb(255 255 255 / 0.82) inset, 0 4px 24px -8px rgb(74 41 75 / 0.12)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <Link
          href={user ? (isAdmin ? '/admin' : '/dashboard') : '/'}
          className="flex items-center gap-2.5 group"
          aria-label="Kaarmik Seek home"
        >
          <div className="relative flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/k-logo.png"
              alt="Kaarmik Seek Logo"
              width={34}
              height={34}
              priority
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <span
            className="font-display text-lg font-medium tracking-tight"
            style={{ color: 'var(--color-plum-700)', fontFamily: 'var(--font-display)' }}
          >
            Kaarmik Seek
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  color: isActive ? 'var(--color-plum-700)' : 'var(--color-ink-muted)',
                  background: isActive ? 'var(--color-plum-50)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full"
                    style={{ background: 'var(--color-gold-500)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop: User / Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Avatar + name */}
              <div
                className="flex items-center gap-2.5 rounded-full px-3 py-1.5"
                style={{ background: 'var(--color-plum-50)', border: '1px solid var(--color-plum-200)' }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--color-plum-700) 0%, var(--color-wine-700) 100%)' }}
                  aria-hidden
                >
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-none" style={{ color: 'var(--color-ink)' }}>
                    {user.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                    {isAdmin ? (
                      <><Shield size={9} style={{ color: 'var(--color-plum-700)' }} /> Admin</>
                    ) : 'Student'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost text-sm flex items-center gap-1.5"
                style={{ minHeight: '36px', padding: '0.375rem 0.875rem', color: 'var(--color-ink-muted)' }}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn btn-ghost text-sm"
                style={{ minHeight: '36px', padding: '0.375rem 1rem', color: 'var(--color-ink-muted)' }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn btn-primary text-sm"
                style={{ minHeight: '36px', padding: '0.375rem 1.25rem' }}
              >
                Create account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: hamburger */}
        <button
          className="flex md:hidden items-center justify-center rounded-lg p-2"
          style={{ color: 'var(--color-ink-muted)', minHeight: '44px', minWidth: '44px' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-1"
          style={{ background: 'var(--color-cream-50)', borderColor: 'var(--color-cream-300)' }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium"
                style={{
                  color: isActive ? 'var(--color-plum-700)' : 'var(--color-ink-muted)',
                  background: isActive ? 'var(--color-plum-50)' : 'transparent',
                  minHeight: '44px',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t mt-2" style={{ borderColor: 'var(--color-cream-300)' }}>
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs capitalize" style={{ color: 'var(--color-ink-muted)' }}>{user.role}</p>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="btn btn-destructive text-sm"
                  style={{ minHeight: '36px', padding: '0.375rem 1rem' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary text-sm text-center"
                  style={{ minHeight: '44px' }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary text-sm text-center"
                  style={{ minHeight: '44px' }}
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
