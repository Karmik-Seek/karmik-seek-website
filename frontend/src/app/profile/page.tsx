'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import type { StudentProfile, EducationItem } from '@/lib/types';
import { AVAILABILITY_OPTIONS, JOB_TYPES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { LoadingSpinner } from '@/components/Feedback';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState<StudentProfile>({
    email: '',
    full_name: '',
    phone: '',
    location: '',
    experience: '',
    skills: [],
    interests: [],
    availability: [],
    preferred_job_types: [],
    education: [],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    api.getProfile()
      .then((data) => {
        setForm({
          email: data.email || user.email,
          full_name: data.full_name || user.full_name || '',
          phone: data.phone || '',
          location: data.location || '',
          experience: data.experience || '',
          skills: data.skills || [],
          interests: data.interests || [],
          availability: data.availability || [],
          preferred_job_types: data.preferred_job_types || [],
          education: data.education || [],
          resume_url: data.resume_url,
          resume_name: data.resume_name,
        });
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(form);
      await refreshProfile();
      showToast('success', 'Profile saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Resume size must be under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const updated = await api.uploadResume(file);
      setForm((prev) => ({
        ...prev,
        resume_url: updated.resume_url,
        resume_name: updated.resume_name,
      }));
      await refreshProfile();
      showToast('success', 'Resume uploaded successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Resume upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const toggleAvailability = (opt: string) => {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.includes(opt)
        ? prev.availability.filter((a) => a !== opt)
        : [...prev.availability, opt],
    }));
  };

  const toggleJobType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      preferred_job_types: prev.preferred_job_types.includes(type)
        ? prev.preferred_job_types.filter((t) => t !== type)
        : [...prev.preferred_job_types, type],
    }));
  };

  const addEducation = () => {
    setForm((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Math.random().toString(), institution: '', degree: '', field: '', year: '' },
      ],
    }));
  };

  const updateEducation = (index: number, field: keyof EducationItem, val: string) => {
    setForm((prev) => {
      const copy = [...prev.education];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, education: copy };
    });
  };

  const removeEducation = (index: number) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  if (authLoading || loading) {
    return (
      <div
        className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
        style={{ background: 'var(--color-cream-100)' }}
      >
        <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
          <div className="pb-6 border-b" style={{ borderColor: 'var(--color-cream-300)' }}>
            <div className="h-4 w-28 bg-black/10 rounded-full mb-3" />
            <div className="h-9 w-60 bg-black/15 rounded-lg mb-2" />
            <div className="h-4 w-96 max-w-full bg-black/10 rounded" />
          </div>

          <div className="space-y-6">
            <div
              className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-5"
              style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
            >
              <div className="h-5 w-40 bg-black/15 rounded" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-10 bg-black/5 rounded-lg" />
                <div className="h-10 bg-black/5 rounded-lg" />
                <div className="h-10 bg-black/5 rounded-lg" />
                <div className="h-10 bg-black/5 rounded-lg" />
              </div>
            </div>

            <div
              className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-5"
              style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
            >
              <div className="h-5 w-32 bg-black/15 rounded" />
              <div className="h-24 bg-black/5 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div
          className="pb-6 border-b"
          style={{ borderColor: 'var(--color-cream-300)' }}
        >
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-2"
            style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
          >
            Student Dossier
          </span>
          <h1
            className="text-h2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Candidate Profile
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
            Keep your academic background, skills, and resume updated to ensure accurate matching.
          </p>
        </div>

        {/* Google User Password Reminder Banner */}
        {user?.auth_provider === 'google' && (
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              background: 'var(--color-gold-100)',
              border: '1px solid var(--color-gold-200)',
            }}
          >
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-ink)' }}>
              <KeyRound size={20} className="shrink-0" style={{ color: 'var(--color-gold-700)' }} />
              <span>
                You are signed in with Google. You can trigger an official password setup email to also log in directly via email & password.
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (user.email) {
                  try {
                    await resetPassword(user.email);
                    showToast('success', `Password setup link sent to ${user.email}!`);
                  } catch (e: any) {
                    showToast('error', e.message || 'Failed to send setup link');
                  }
                }
              }}
              className="btn btn-secondary text-xs shrink-0"
            >
              Send Password Setup Link
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Details */}
          <div
            className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-5"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <h2
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: 'var(--color-ink)' }}
            >
              <User size={18} style={{ color: 'var(--color-plum-700)' }} /> Personal Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  Email Address (Primary)
                </label>
                <input
                  type="email"
                  disabled
                  value={form.email}
                  className="input-field text-xs opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  Location / City
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                Experience & Academic Bio
              </label>
              <textarea
                rows={3}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="Brief summary of your academic background, coursework, internships, or key projects..."
                className="input-field text-xs resize-none"
              />
            </div>
          </div>

          {/* Resume Upload */}
          <div
            className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-4"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <h2
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: 'var(--color-ink)' }}
            >
              <FileText size={18} style={{ color: 'var(--color-plum-700)' }} /> Resume Document
            </h2>

            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-5"
              style={{
                border: '1.5px dashed var(--color-cream-300)',
                background: 'var(--color-cream-50)',
              }}
            >
              <div>
                {form.resume_name ? (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={20} style={{ color: 'var(--color-sage-600)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {form.resume_name}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await api.getMyResumeLink();
                            window.open(res.url, '_blank', 'noopener,noreferrer');
                          } catch (e: any) {
                            showToast('error', e.message || 'Failed to open resume');
                          }
                        }}
                        className="text-xs font-semibold hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer bg-transparent border-none p-0"
                        style={{ color: 'var(--color-plum-700)' }}
                      >
                        View / Download Resume <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    No resume uploaded yet. Supported formats: PDF, DOCX (up to 5 MB).
                  </p>
                )}
              </div>

              <label className="btn btn-secondary text-xs cursor-pointer shrink-0">
                <Upload size={14} />
                {uploading ? 'Uploading…' : form.resume_name ? 'Replace Resume' : 'Upload Resume'}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  disabled={uploading}
                  onChange={handleResumeUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Education Section */}
          <div
            className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-5"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: 'var(--color-ink)' }}
              >
                <GraduationCap size={18} style={{ color: 'var(--color-plum-700)' }} /> Education History
              </h2>
              <button
                type="button"
                onClick={addEducation}
                className="btn btn-ghost text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--color-plum-700)' }}
              >
                <Plus size={14} /> Add Degree
              </button>
            </div>

            {form.education.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--color-ink-muted)' }}>
                No education entries added yet. Click &quot;Add Degree&quot; to list your university credentials.
              </p>
            ) : (
              <div className="space-y-4">
                {form.education.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl p-4 space-y-3"
                    style={{
                      background: 'var(--color-cream-50)',
                      border: '1px solid var(--color-cream-300)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="absolute top-3 right-3 text-sm p-1 rounded hover:bg-black/5"
                      style={{ color: 'var(--color-wine-700)' }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 pr-8">
                      <div>
                        <label className="block text-[11px] font-semibold mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                          Institution / University
                        </label>
                        <input
                          type="text"
                          value={item.institution}
                          onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                          placeholder="e.g. Bangalore University"
                          className="input-field text-xs py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                          Degree
                        </label>
                        <input
                          type="text"
                          value={item.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          placeholder="e.g. B.Tech / BCA"
                          className="input-field text-xs py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                          Field of Study
                        </label>
                        <input
                          type="text"
                          value={item.field}
                          onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="input-field text-xs py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                          Graduation Year
                        </label>
                        <input
                          type="text"
                          value={item.year}
                          onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                          placeholder="e.g. 2026"
                          className="input-field text-xs py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div
            className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-5"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <h2
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: 'var(--color-ink)' }}
            >
              <Sparkles size={18} style={{ color: 'var(--color-plum-700)' }} /> Skills Matrix
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type skill tag (e.g. React, Python, Figma, SQL) and press Add..."
                className="input-field text-xs"
              />
              <button
                type="button"
                onClick={addSkill}
                className="btn btn-secondary shrink-0 text-xs px-4"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {form.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: 'var(--color-plum-100)',
                    color: 'var(--color-plum-700)',
                    border: '1px solid var(--color-plum-200)',
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:opacity-75 ml-1"
                    aria-label={`Remove ${skill}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div
            className="glass rounded-[var(--radius-card)] p-6 sm:p-7 space-y-5"
            style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
          >
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
              Career Preferences & Availability
            </h2>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                Availability
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((opt) => {
                  const active = form.availability.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleAvailability(opt)}
                      className="rounded-full px-3.5 py-1 text-xs font-medium transition-all"
                      style={
                        active
                          ? { background: 'var(--color-plum-700)', color: '#fff' }
                          : {
                              background: 'var(--color-cream-50)',
                              border: '1px solid var(--color-cream-300)',
                              color: 'var(--color-ink-muted)',
                            }
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                Preferred Job Types
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((type) => {
                  const active = form.preferred_job_types.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleJobType(type)}
                      className="rounded-full px-3.5 py-1 text-xs font-medium transition-all"
                      style={
                        active
                          ? { background: 'var(--color-plum-700)', color: '#fff' }
                          : {
                              background: 'var(--color-cream-50)',
                              border: '1px solid var(--color-cream-300)',
                              color: 'var(--color-ink-muted)',
                            }
                      }
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8 py-3 text-sm font-semibold"
            >
              {saving ? 'Saving changes…' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
