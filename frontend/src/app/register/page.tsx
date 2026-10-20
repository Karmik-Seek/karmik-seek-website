'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';

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

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const newUser = await registerWithEmail(email, password, fullName);
      showToast('success', 'Account created! Welcome to Kaarmik Seek.');
      router.push(newUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const newUser = await loginWithGoogle();
      showToast('success', `Welcome, ${newUser.full_name || 'User'}!`);
      router.push(newUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-up could not be completed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-dvh flex items-center justify-center px-4 py-16"
      style={{ background: 'var(--color-cream-100)' }}
    >
      {/* Ambient backdrop blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full"
          style={{ background: 'rgb(74 41 75 / 0.15)', filter: 'blur(100px)' }} />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full"
          style={{ background: 'rgb(199 160 90 / 0.15)', filter: 'blur(100px)' }} />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5" aria-label="Kaarmik Seek">
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
          <h1 className="text-display-lg mb-2" style={{ color: 'var(--color-ink)' }}>
            Create your account
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Free for students. Find matched internships in minutes.
          </p>
        </div>

        {/* Card */}
        <div
          className="glass rounded-[var(--radius-panel)] p-8 space-y-5"
          style={{ border: '1px solid rgb(255 255 255 / 0.65)' }}
        >
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              role="alert"
              style={{ background: 'var(--color-wine-100)', color: 'var(--color-wine-700)', border: '1px solid rgb(95 33 71 / 0.2)' }}
            >
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            id="google-sign-up"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="btn btn-secondary w-full text-sm"
            style={{ justifyContent: 'center', gap: '0.625rem' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
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
                or register with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-grey-500)' }} />
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Prajwal Ganiga"
                  className="input-field"
                  style={{ paddingLeft: '2.625rem' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-grey-500)' }} />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="input-field"
                  style={{ paddingLeft: '2.625rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-grey-500)' }} />
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field"
                  style={{ paddingLeft: '2.625rem', paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ color: 'var(--color-grey-500)', minHeight: '44px', minWidth: '44px' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                Minimum 6 characters
              </p>
            </div>

            <button
              id="create-account-submit"
              type="submit"
              disabled={loading || googleLoading}
              className="btn btn-primary w-full text-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--color-ink-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-plum-700)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
