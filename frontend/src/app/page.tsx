'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, TrendingUp, Sparkles, Clock, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

/* ─── Ambient Backdrop ──────────────────────────────────────────────────── */
function AmbientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'var(--color-cream-100)' }}
    >
      {/* Top-left plum blob */}
      <div
        className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full"
        style={{ background: 'rgb(74 41 75 / 0.18)', filter: 'blur(120px)' }}
      />
      {/* Right wine blob */}
      <div
        className="absolute top-1/3 -right-40 h-[38rem] w-[38rem] rounded-full"
        style={{ background: 'rgb(95 33 71 / 0.12)', filter: 'blur(140px)' }}
      />
      {/* Bottom gold blob */}
      <div
        className="absolute bottom-[-12rem] left-1/4 h-[30rem] w-[30rem] rounded-full"
        style={{ background: 'rgb(199 160 90 / 0.18)', filter: 'blur(130px)' }}
      />
    </div>
  );
}



/* ─── How It Works Pillar ───────────────────────────────────────────────── */
function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
        {body}
      </p>
    </div>
  );
}

/* ─── Creative Cinematic Intro Experience (Once Per Session) ───────────── */
function IntroExperience() {
  const [show, setShow] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    // Only show once per browser session
    try {
      const seen = sessionStorage.getItem('kaarmik_intro_seen');
      if (!seen) {
        setShow(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const dismiss = React.useCallback(() => {
    if (exiting) return;
    setExiting(true);
    try {
      sessionStorage.setItem('kaarmik_intro_seen', 'true');
    } catch {
      // ignore storage errors
    }
    setTimeout(() => {
      setShow(false);
    }, 700);
  }, [exiting]);

  React.useEffect(() => {
    if (!show) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKey);
    // Automatic timeout fallback so page is never blocked
    const timer = setTimeout(dismiss, 6500);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
    };
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Kaarmik Seek Introduction"
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 cursor-pointer select-none transition-all duration-700 ease-out ${
        exiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'var(--color-cream-100)',
      }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[32rem] w-[32rem] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(199, 160, 90, 0.25) 0%, rgba(74, 41, 75, 0.12) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Video presentation */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full">
        <div
          className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--color-cream-100)',
            border: '1px solid rgb(255 255 255 / 0.8)',
            boxShadow: '0 30px 60px -15px rgba(74, 41, 75, 0.20), 0 0 0 1px rgba(199, 160, 90, 0.2)',
          }}
        >
          <video
            src="/k-logo-intro.mp4"
            autoPlay
            muted
            playsInline
            onEnded={dismiss}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand signature under video */}
        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <span
            className="font-display text-2xl font-medium tracking-tight"
            style={{ color: 'var(--color-plum-700)', fontFamily: 'var(--font-display)' }}
          >
            Kaarmik Seek
          </span>
          <p className="text-xs tracking-wider uppercase font-semibold" style={{ color: 'var(--color-gold-600)' }}>
            Campus recruitment, reimagined
          </p>
        </div>
      </div>

      {/* Skip button in corner */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="absolute top-6 right-6 z-20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all hover:bg-plum-100"
        style={{
          background: 'rgb(74 41 75 / 0.08)',
          color: 'var(--color-plum-700)',
          border: '1px solid rgb(74 41 75 / 0.15)',
        }}
      >
        Skip intro &rarr;
      </button>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  React.useEffect(() => {
    api.warmup();
  }, []);

  const primaryHref = user
    ? isAdmin ? '/admin' : '/dashboard'
    : '/register';
  const primaryLabel = user
    ? isAdmin ? 'Go to Admin' : 'Go to Dashboard'
    : 'Create free account';

  return (
    <>
      <IntroExperience />
      <AmbientBackdrop />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 py-14 lg:py-24">

          {/* Left: text content */}
          <div className="flex-1 max-w-xl">
            {/* Eyebrow */}
            <p
              className="mb-5 text-sm font-semibold tracking-wide"
              style={{ color: 'var(--color-plum-500)' }}
            >
              Campus recruitment, reimagined
            </p>

            {/* Headline */}
            <h1
              className="text-display-xl mb-6"
              style={{ color: 'var(--color-ink)' }}
            >
              Your first role,<br />
              matched to what<br />
              <em style={{ color: 'var(--color-plum-700)', fontStyle: 'italic' }}>you can already do.</em>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg leading-relaxed mb-8"
              style={{ color: 'var(--color-ink-muted)', maxWidth: '48ch' }}
            >
              Kaarmik Seek compares your profile with every campus role, shows exactly which skills match, and tracks every application transparently — no ghosting.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={primaryHref} className="btn btn-primary text-base">
                {primaryLabel}
                <ArrowRight size={17} />
              </Link>
              <Link href="/jobs" className="btn btn-secondary text-base">
                <Briefcase size={17} style={{ color: 'var(--color-plum-500)' }} />
                Browse open roles
              </Link>
            </div>

            {/* Feature bullets */}
            <ul className="mt-8 space-y-2.5">
              {[
                'Skill match scored on 5 real dimensions — not keyword guessing',
                'Application pipeline visible from submitted to final decision',
                'Interview invites with date, time, and meeting link in one place',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-sage-600)' }} />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: 3D Isometric Coworking Diorama */}
          <div className="relative flex-1 w-full max-w-xl lg:max-w-[620px] xl:max-w-[690px] flex items-center justify-center">
            {/* Ambient studio glow behind diorama */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(199, 160, 90, 0.20) 0%, rgba(95, 33, 71, 0.08) 48%, transparent 72%)',
                filter: 'blur(50px)',
              }}
            />

            {/* Diorama presentation */}
            <div className="relative w-full transition-transform duration-500 ease-out hover:scale-[1.02]">
              <Image
                src="/hero-coworking.png"
                alt="Modern isometric coworking office diorama illustrating collaborative student teams and interview spaces"
                width={1326}
                height={835}
                priority
                className="w-full h-auto object-contain select-none pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 26px 42px rgba(50, 20, 50, 0.12))',
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 690px"
              />

              {/* Sleek Floating status pill */}
              <div
                className="absolute -bottom-2 right-4 sm:right-8 glass-plum rounded-full px-4 py-2 flex items-center gap-2.5 shadow-xl border border-white/20 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, rgba(74, 41, 75, 0.94) 0%, rgba(95, 33, 71, 0.90) 100%)',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-white tracking-wide">
                  Active Hiring &amp; Interviews
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="mb-12 max-w-xl">
          <h2 className="text-h2 mb-3" style={{ color: 'var(--color-ink)' }}>
            Built around how students actually work
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
            Traditional job boards are designed for full-time professionals. Kaarmik Seek is engineered around exams, college timetables, and student resumes.
          </p>
        </div>

        {/* Three pillars in one glass panel with hairline dividers */}
        <div
          className="glass rounded-[var(--radius-card)] p-8 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x"
          style={{ borderColor: 'rgb(255 255 255 / 0.65)', '--tw-divide-opacity': '1', divideColor: 'var(--color-plum-200)' } as React.CSSProperties}
        >
          <Pillar
            icon={<Sparkles size={20} />}
            title="Skill-based matching"
            body="Your profile is scored against each role across skills, education eligibility, experience, schedule compatibility, and location — giving you a transparent 0–100% fit."
          />
          <div className="md:pl-8">
            <Pillar
              icon={<TrendingUp size={20} />}
              title="Open pipeline, zero ghosting"
              body="Every application shows exactly where it stands: Applied, Shortlisted, Interview Scheduled, or Decision. No black box, no waiting weeks without an update."
            />
          </div>
          <div className="md:pl-8">
            <Pillar
              icon={<Clock size={20} />}
              title="Interview details in one place"
              body="When a recruiter schedules your interview, you see the date, time, platform link, and recruiter notes — directly in your applications dashboard."
            />
          </div>
        </div>
      </section>

      {/* ── Featured Roles (top 3 from backend, labelled) ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-h2" style={{ color: 'var(--color-ink)' }}>
            Open roles right now
          </h2>
          <Link
            href="/jobs"
            className="btn btn-ghost text-sm"
            style={{ color: 'var(--color-plum-700)', minHeight: '36px', padding: '0.375rem 1rem' }}
          >
            View all roles <ArrowRight size={14} />
          </Link>
        </div>

        {/* These are pulled dynamically on the /jobs page; here we point users there */}
        <div
          className="glass rounded-[var(--radius-card)] p-10 text-center"
          style={{ border: '1px solid rgb(255 255 255 / 0.65)' }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
          >
            <Briefcase size={22} />
          </div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--color-ink)' }}>
            Live roles are on the jobs page
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-ink-muted)' }}>
            Sign in to see your personalised match scores alongside each open position.
          </p>
          <Link href="/jobs" className="btn btn-primary text-sm">
            Browse open roles <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-28">
        <div
          className="relative rounded-[var(--radius-panel)] overflow-hidden p-10 sm:p-16 text-center"
          style={{
            background: 'linear-gradient(160deg, var(--color-plum-700) 0%, var(--color-wine-700) 100%)',
            boxShadow: '0 30px 80px -24px rgb(74 41 75 / 0.50)',
          }}
        >
          {/* Subtle inner glow */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background: 'radial-gradient(ellipse at 50% -10%, rgb(199 160 90 / 0.20) 0%, transparent 60%)',
            }}
          />

          <h2
            className="text-h2 mb-3 relative"
            style={{ color: '#fff', fontFamily: 'var(--font-display)' }}
          >
            Ready to find your first role?
          </h2>
          <p
            className="text-base mb-8 relative"
            style={{ color: 'rgb(255 255 255 / 0.75)', maxWidth: '46ch', margin: '0 auto 2rem' }}
          >
            Create your profile, and let the matching engine show you exactly which campus roles fit you today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <Link href="/register" className="btn btn-gold text-base">
              Create free account <ArrowRight size={17} />
            </Link>
            <Link
              href="/jobs"
              className="btn text-sm"
              style={{
                background: 'rgb(255 255 255 / 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgb(255 255 255 / 0.20)',
                color: '#fff',
                minHeight: '44px',
                padding: '0.625rem 1.5rem',
                borderRadius: 'var(--radius-control)',
              }}
            >
              Browse roles first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
