'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  GraduationCap,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  Briefcase,
  KeyRound
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import StatusBadge from '@/components/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/Feedback';
import { useToast } from '@/components/Toast';

interface UserDirectoryItem {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  auth_provider: string;
  created_at: string;
  updated_at: string;
  applications_count: number;
  profile?: {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    location?: string;
    experience?: string;
    skills?: string[];
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      year: string;
    }>;
    resume_url?: string;
    resume_name?: string;
  } | null;
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading member directory..." />}>
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'admins'>('all');
  const [resumeFilter, setResumeFilter] = useState<'all' | 'with_resume' | 'no_resume'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'google' | 'password'>('all');

  // Selected user for detail dossier
  const [selectedUser, setSelectedUser] = useState<UserDirectoryItem | null>(null);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

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
    loadUsers();
  }, [user, authLoading, router]);

  const handleOpenDossier = async (u: UserDirectoryItem) => {
    setSelectedUser(u);
    setLoadingDossier(true);
    try {
      const details = await api.getAdminUserDetails(u.id);
      setSelectedUser(details);
      setUserApplications(details.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDossier(false);
    }
  };

  // Counts
  const totalCount = users.length;
  const studentsCount = users.filter((u) => u.role === 'student').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (activeTab === 'students' && u.role !== 'student') return false;
      if (activeTab === 'admins' && u.role !== 'admin') return false;

      // Resume filter
      if (resumeFilter === 'with_resume') {
        if (!u.profile?.resume_url) return false;
      } else if (resumeFilter === 'no_resume') {
        if (u.profile?.resume_url) return false;
      }

      // Provider filter
      if (providerFilter !== 'all') {
        const prov = (u.auth_provider || '').toLowerCase();
        if (providerFilter === 'google' && !prov.includes('google')) return false;
        if (providerFilter === 'password' && !prov.includes('password') && prov.includes('google')) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = (u.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesSkills = (u.profile?.skills || []).some((s) => s.toLowerCase().includes(q));
        const matchesEdu = (u.profile?.education || []).some(
          (e) => e.institution.toLowerCase().includes(q) || e.degree.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesEmail && !matchesSkills && !matchesEdu) {
          return false;
        }
      }

      return true;
    });
  }, [users, activeTab, resumeFilter, providerFilter, search]);

  if (authLoading || loading) return <LoadingSpinner label="Loading directory..." />;

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-cream-300)' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-plum-700)' }}>
              <Shield size={14} /> Identity & Access Governance
            </div>
            <h1
              className="text-h2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Member Directory & Administrators
            </h1>
            <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
              Search across student candidates, inspect academic dossiers, and verify administrator privileges.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadUsers}
              className="btn btn-secondary text-xs"
            >
              Refresh Directory
            </button>
          </div>
        </div>

        {/* Dedicated Area Tabs: All, Students, Admins */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-cream-300)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className="rounded-full px-4 py-2 text-xs font-semibold transition-all inline-flex items-center gap-2"
            style={
              activeTab === 'all'
                ? { background: 'var(--color-plum-700)', color: '#fff' }
                : { background: 'var(--color-cream-50)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-cream-300)' }
            }
          >
            <Users size={14} /> All Members ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className="rounded-full px-4 py-2 text-xs font-semibold transition-all inline-flex items-center gap-2"
            style={
              activeTab === 'students'
                ? { background: 'var(--color-plum-700)', color: '#fff' }
                : { background: 'var(--color-cream-50)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-cream-300)' }
            }
          >
            <GraduationCap size={14} /> Student Candidates ({studentsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className="rounded-full px-4 py-2 text-xs font-semibold transition-all inline-flex items-center gap-2"
            style={
              activeTab === 'admins'
                ? { background: 'var(--color-plum-700)', color: '#fff', border: '1px solid var(--color-gold-500)' }
                : { background: 'var(--color-gold-100)', color: 'var(--color-gold-700)', border: '1px solid var(--color-gold-200)' }
            }
          >
            <Shield size={14} /> Platform Administrators ({adminsCount})
          </button>
        </div>

        {/* Search & Smart Filters Bar */}
        <div
          className="glass rounded-[var(--radius-card)] p-4 sm:p-5 space-y-4"
          style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
        >
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-grey-500)' }}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, email, skill (e.g. React, Python), or university..."
                className="input-field text-xs"
                style={{ paddingLeft: '2.5rem' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Smart Filter Selects */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={resumeFilter}
                onChange={(e) => setResumeFilter(e.target.value as any)}
                className="input-field text-xs py-2 w-auto"
                aria-label="Filter by resume status"
              >
                <option value="all">Resume: All</option>
                <option value="with_resume">With Uploaded Resume</option>
                <option value="no_resume">Without Resume</option>
              </select>

              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value as any)}
                className="input-field text-xs py-2 w-auto"
                aria-label="Filter by auth provider"
              >
                <option value="all">Auth: All Methods</option>
                <option value="google">Google Sign-in</option>
                <option value="password">Email / Password</option>
              </select>

              {(search || resumeFilter !== 'all' || providerFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setResumeFilter('all');
                    setProviderFilter('all');
                  }}
                  className="text-xs font-semibold hover:underline px-2 py-1"
                  style={{ color: 'var(--color-wine-700)' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Directory List View */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members match criteria"
            description="Try modifying your search query or selecting a different filter option."
          />
        ) : (
          <div
            className="glass rounded-[var(--radius-card)] overflow-hidden divide-y"
            style={{
              borderColor: 'var(--color-cream-300)',
              border: '1px solid rgb(255 255 255 / 0.7)',
            }}
          >
            {filteredUsers.map((u) => {
              const isAdmin = u.role === 'admin';
              const hasResume = Boolean(u.profile?.resume_url);
              const skillsCount = u.profile?.skills?.length || 0;
              const edu = u.profile?.education?.[0];

              return (
                <div
                  key={u.id}
                  onClick={() => handleOpenDossier(u)}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-black/[0.02] cursor-pointer transition-colors"
                >
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm text-white shadow-sm"
                      style={{
                        background: isAdmin
                          ? 'linear-gradient(135deg, var(--color-plum-700) 0%, var(--color-wine-700) 100%)'
                          : 'linear-gradient(135deg, var(--color-plum-600) 0%, var(--color-gold-600) 100%)',
                      }}
                    >
                      {u.full_name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                          {u.full_name || u.email.split('@')[0]}
                        </h3>

                        {/* Role Badge */}
                        {isAdmin ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)', border: '1px solid var(--color-plum-200)' }}
                          >
                            <Shield size={10} /> Administrator
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ background: 'var(--color-sage-100)', color: 'var(--color-sage-600)' }}
                          >
                            <GraduationCap size={10} /> Student
                          </span>
                        )}

                        {/* Auth Provider */}
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: 'var(--color-cream-50)', border: '1px solid var(--color-cream-300)', color: 'var(--color-ink-muted)' }}
                        >
                          {u.auth_provider === 'google' ? 'Google Auth' : 'Password Credential'}
                        </span>
                      </div>

                      <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                        <Mail size={12} className="inline mr-1 opacity-70" /> {u.email}
                        {u.profile?.phone && (
                          <> · <Phone size={12} className="inline mr-1 opacity-70" /> {u.profile.phone}</>
                        )}
                        {u.profile?.location && (
                          <> · <MapPin size={12} className="inline mr-1 opacity-70" /> {u.profile.location}</>
                        )}
                      </p>

                      {/* Education teaser if available */}
                      {edu && (
                        <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                          🎓 {edu.degree} {edu.field && `in ${edu.field}`} · {edu.institution} ({edu.year})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right: Badges & Quick Stats */}
                  <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
                    {/* Resume status */}
                    {!isAdmin && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={
                          hasResume
                            ? { background: 'var(--color-sage-100)', color: 'var(--color-sage-600)' }
                            : { background: 'var(--color-cream-50)', color: 'var(--color-grey-600)', border: '1px solid var(--color-cream-300)' }
                        }
                      >
                        <FileText size={12} />
                        {hasResume ? 'Resume Ready' : 'No Resume'}
                      </span>
                    )}

                    {/* Applications Count */}
                    {!isAdmin && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
                        style={{ background: 'var(--color-plum-50)', color: 'var(--color-plum-700)', border: '1px solid var(--color-plum-200)' }}
                      >
                        <Briefcase size={12} />
                        {u.applications_count} {u.applications_count === 1 ? 'App' : 'Apps'}
                      </span>
                    )}

                    {/* Skills pills teaser */}
                    {skillsCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: 'var(--color-gold-100)', color: 'var(--color-gold-700)' }}
                      >
                        <Sparkles size={11} /> {skillsCount} Skills
                      </span>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDossier(u);
                      }}
                    >
                      {isAdmin ? 'View Access' : 'Inspect Dossier'} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Member Dossier Modal / Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-3xl rounded-[var(--radius-panel)] p-6 sm:p-8 shadow-pop space-y-6 my-auto max-h-[88vh] overflow-y-auto"
              style={{
                background: 'var(--color-cream-50)',
                border: '1px solid var(--color-cream-300)',
              }}
            >
              {/* Modal Header */}
              <div
                className="flex items-start justify-between pb-4 border-b"
                style={{ borderColor: 'var(--color-cream-300)' }}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-base text-white shadow-sm"
                    style={{
                      background: selectedUser.role === 'admin'
                        ? 'linear-gradient(135deg, var(--color-plum-700) 0%, var(--color-wine-700) 100%)'
                        : 'linear-gradient(135deg, var(--color-plum-600) 0%, var(--color-gold-600) 100%)',
                    }}
                  >
                    {selectedUser.full_name?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className="text-2xl font-semibold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                      >
                        {selectedUser.full_name || selectedUser.email.split('@')[0]}
                      </h2>
                      {selectedUser.role === 'admin' ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                        >
                          <Shield size={10} /> Admin
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: 'var(--color-sage-100)', color: 'var(--color-sage-600)' }}
                        >
                          <GraduationCap size={10} /> Candidate
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                      {selectedUser.email} · Registered on {new Date(selectedUser.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg hover:bg-black/5"
                  style={{ color: 'var(--color-grey-600)' }}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDossier ? (
                <LoadingSpinner label="Fetching dossier details..." />
              ) : (
                <div className="space-y-6">
                  {/* Admin Specific Privileges Box */}
                  {selectedUser.role === 'admin' && (
                    <div
                      className="rounded-xl p-5 space-y-3"
                      style={{
                        background: 'var(--color-gold-100)',
                        border: '1px solid var(--color-gold-200)',
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-gold-700)' }}>
                        <Shield size={18} /> Platform Administrator Privileges
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                        This user holds executive privileges on the Kaarmik Seek recruitment engine. They have full authority to create and archive job postings, inspect candidate resumes and dossiers, schedule interviews, and issue final hiring offers.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 text-xs">
                        <span className="rounded-md px-2.5 py-1 bg-white/60 font-semibold" style={{ color: 'var(--color-gold-700)' }}>
                          ✓ Job Postings Management
                        </span>
                        <span className="rounded-md px-2.5 py-1 bg-white/60 font-semibold" style={{ color: 'var(--color-gold-700)' }}>
                          ✓ Full Candidate Dossier Inspection
                        </span>
                        <span className="rounded-md px-2.5 py-1 bg-white/60 font-semibold" style={{ color: 'var(--color-gold-700)' }}>
                          ✓ Interview Scheduling & Offers
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contact & Bio */}
                  <div
                    className="glass rounded-xl p-5 space-y-3"
                    style={{ background: 'var(--color-cream-100)', border: '1px solid var(--color-cream-300)' }}
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                      Contact & Demographic Details
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3 text-xs">
                      <div>
                        <span className="block text-[11px] font-medium" style={{ color: 'var(--color-grey-600)' }}>Phone</span>
                        <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                          {selectedUser.profile?.phone || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium" style={{ color: 'var(--color-grey-600)' }}>Location</span>
                        <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                          {selectedUser.profile?.location || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium" style={{ color: 'var(--color-grey-600)' }}>Auth Provider</span>
                        <span className="font-semibold capitalize" style={{ color: 'var(--color-ink)' }}>
                          {selectedUser.auth_provider || 'Password'}
                        </span>
                      </div>
                    </div>

                    {selectedUser.profile?.experience && (
                      <div className="pt-2 border-t" style={{ borderColor: 'var(--color-cream-300)' }}>
                        <span className="block text-[11px] font-medium mb-1" style={{ color: 'var(--color-grey-600)' }}>Bio / Experience</span>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                          {selectedUser.profile.experience}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Student Resume Document */}
                  {selectedUser.role === 'student' && (
                    <div
                      className="glass rounded-xl p-5 space-y-3"
                      style={{ background: 'var(--color-cream-100)', border: '1px solid var(--color-cream-300)' }}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                        Verified Resume Document
                      </h4>
                      {selectedUser.profile?.resume_url ? (
                        <div
                          className="flex items-center justify-between rounded-lg p-3.5"
                          style={{
                            background: 'var(--color-cream-50)',
                            border: '1px solid var(--color-cream-300)',
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText size={20} style={{ color: 'var(--color-plum-700)' }} />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
                                {selectedUser.profile.resume_name || 'Resume Document'}
                              </p>
                              <span className="text-[11px]" style={{ color: 'var(--color-sage-600)' }}>
                                Ready for employer review
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await api.getUserResumeLink(selectedUser.id);
                                window.open(res.url, '_blank', 'noopener,noreferrer');
                              } catch (e: any) {
                                showToast('error', e.message || 'Failed to open user resume');
                              }
                            }}
                            className="btn btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1 cursor-pointer"
                          >
                            View / Download <ExternalLink size={12} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs italic" style={{ color: 'var(--color-ink-muted)' }}>
                          No resume document uploaded by this student yet.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Skills Tag Matrix */}
                  {selectedUser.role === 'student' && selectedUser.profile?.skills && selectedUser.profile.skills.length > 0 && (
                    <div
                      className="glass rounded-xl p-5 space-y-3"
                      style={{ background: 'var(--color-cream-100)', border: '1px solid var(--color-cream-300)' }}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                        Skills Matrix ({selectedUser.profile.skills.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.profile.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              background: 'var(--color-plum-50)',
                              color: 'var(--color-plum-700)',
                              border: '1px solid var(--color-plum-200)',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education History */}
                  {selectedUser.role === 'student' && selectedUser.profile?.education && selectedUser.profile.education.length > 0 && (
                    <div
                      className="glass rounded-xl p-5 space-y-3"
                      style={{ background: 'var(--color-cream-100)', border: '1px solid var(--color-cream-300)' }}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                        Education Credentials
                      </h4>
                      <div className="space-y-2">
                        {selectedUser.profile.education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg p-3 text-xs space-y-0.5"
                            style={{ background: 'var(--color-cream-50)', border: '1px solid var(--color-cream-300)' }}
                          >
                            <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                              {edu.degree} in {edu.field}
                            </p>
                            <p style={{ color: 'var(--color-ink-muted)' }}>
                              {edu.institution} · Class of {edu.year}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Applications History */}
                  {selectedUser.role === 'student' && (
                    <div
                      className="glass rounded-xl p-5 space-y-3"
                      style={{ background: 'var(--color-cream-100)', border: '1px solid var(--color-cream-300)' }}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                        Submitted Applications ({userApplications.length})
                      </h4>
                      {userApplications.length === 0 ? (
                        <p className="text-xs italic" style={{ color: 'var(--color-ink-muted)' }}>
                          This student has not submitted any applications yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {userApplications.map((app) => (
                            <div
                              key={app.id}
                              className="flex items-center justify-between p-3 rounded-lg text-xs"
                              style={{ background: 'var(--color-cream-50)', border: '1px solid var(--color-cream-300)' }}
                            >
                              <div>
                                <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                                  {app.job_title || 'Role Application'}
                                </p>
                                <p style={{ color: 'var(--color-ink-muted)' }}>
                                  {app.company} · Applied on {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <StatusBadge status={app.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
