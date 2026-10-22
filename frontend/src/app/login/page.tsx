'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, loginWithEmail, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefetch target routes and warmup backend on mount
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/admin');
    api.warmup();
  }, [router]);

  // If already authenticated with cached session, redirect immediately
  useEffect(() => {
    if (user && !loading && !googleLoading) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, loading, googleLoading, router]);

  // Cleanup slow server timer on unmount
  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const startSlowTimer = () => {
    setSlowNotice(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      setSlowNotice(true);
    }, 3000);
  };

  const clearSlowTimer = () => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    setSlowNotice(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError('');
    setLoading(true);
    startSlowTimer();

    try {
      const loggedInUser = await loginWithEmail(email, password);
      clearSlowTimer();
      const targetRoute = loggedInUser.role === 'admin' ? '/admin' : '/dashboard';
      showToast('success', `Welcome back, ${loggedInUser.full_name || 'User'}!`);
      router.replace(targetRoute);
    } catch (err: any) {
      clearSlowTimer();
      setLoading(false);
      let msg = 'Login failed. Check your email and password and try again.';
      if (err.code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait or reset your password.';
      else if (err.message) msg = err.message;
      setError(msg);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    startSlowTimer();

    try {
      const loggedInUser = await loginWithGoogle();
      clearSlowTimer();
      const targetRoute = loggedInUser.role === 'admin' ? '/admin' : '/dashboard';
      showToast('success', `Welcome, ${loggedInUser.full_name || 'User'}!`);
      router.replace(targetRoute);
    } catch (err: any) {
      clearSlowTimer();
      setGoogleLoading(false);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in could not be completed.');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { showToast('error', 'Enter your email address.'); return; }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      showToast('success', 'Password reset link sent. Check your inbox.');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      showToast('error', err.message || 'Could not send reset link. Try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const isInteracting = loading || googleLoading;

  return (
    <div
      className="relative min-h-dvh flex items-center justify-center px-4 py-16"
      style={{ background: 'var(--color-cream-100)' }}
    >
      {/* Ambient backdrop blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full"
          style={{ background: 'rgb(74 41 75 / 0.15)', filter: 'blur(100px)' }} />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full"
          style={{ background: 'rgb(199 160 90 / 0.15)', filter: 'blur(100px)' }} />
      </div>

      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 mb-5"
            aria-label="Kaarmik Seek"
          >
            <div className="relative flex h-14 w-14 items-center justify-center transition-transform hover:scale-105">
              <Image
                src="/k-logo.png"
                alt="Kaarmik Seek Logo"
                width={52}
                height={52}
                priority
                className="object-contain"
                style={{ filter: 'drop-shadow(0 6px 14px rgba(74, 41, 75, 0.25))', width: 'auto', height: 'auto' }}
              />
            </div>
          </Link>
          <h1
            className="text-display-lg mb-2"
            style={{ color: 'var(--color-ink)' }}
          >
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Sign in to your student or recruiter account
          </p>
        </div>

        {/* Card */}
        <div
          className="glass rounded-[var(--radius-panel)] p-8 space-y-5"
          style={{ border: '1px solid rgb(255 255 255 / 0.65)' }}
        >
          {/* Error banner */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              role="alert"
              style={{ background: 'var(--color-wine-100)', color: 'var(--color-wine-700)', border: '1px solid rgb(95 33 71 / 0.2)' }}
            >
              {error}
            </div>
          )}

          {/* Render cold start warming indicator */}
          {slowNotice && (
            <div
              className="rounded-xl px-4 py-3 text-xs flex items-center gap-2.5 animate-pulse"
              role="status"
              style={{
                background: 'var(--color-gold-100)',
                color: 'var(--color-gold-700)',
                border: '1px solid var(--color-gold-200)',
              }}
            >
              <Loader2 size={15} className="animate-spin shrink-0 text-amber-700" />
              <span>Waking up the server, this can take a few seconds on first visit…</span>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            id="google-sign-in"
            onClick={handleGoogleLogin}
            disabled={isInteracting}
            className="btn btn-secondary w-full text-sm"
            style={{ justifyContent: 'center', gap: '0.625rem' }}
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px" style={{ background: 'var(--color-cream-300)' }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-xs font-medium"
                style={{ background: 'rgb(255 255 255 / 0.58)', color: 'var(--color-grey-500)', backdropFilter: 'blur(4px)' }}
              >
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-ink)' }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-grey-500)' }}
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isInteracting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-field"
                  style={{ paddingLeft: '2.625rem' }}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-ink)' }}
                >
                  Password
                </label>
                <button
                  type="button"
                  disabled={isInteracting}
                  onClick={() => { setForgotEmail(email); setShowForgotModal(true); }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--color-gold-700)' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-grey-500)' }}
                />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={isInteracting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '2.625rem', paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  disabled={isInteracting}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-grey-500)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="sign-in-submit"
              type="submit"
              disabled={isInteracting}
              className="btn btn-primary w-full text-sm"
              style={{ justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing you in…' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--color-ink-muted)' }}>
          New to Kaarmik Seek?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-plum-700)' }}>
            Create account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgb(30 14 32 / 0.45)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
        >
          <div
            className="w-full max-w-sm glass-strong rounded-[var(--radius-panel)] p-7 space-y-5"
            style={{ boxShadow: '0 30px 80px -24px rgb(30 14 32 / 0.45)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
              >
                <KeyRound size={18} />
              </div>
              <div>
                <h2 id="forgot-title" className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Reset password
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  We&apos;ll send a reset link to your inbox.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn btn-ghost text-sm"
                  style={{ minHeight: '40px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-primary text-sm"
                  style={{ minHeight: '40px' }}
                >
                  {forgotLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
