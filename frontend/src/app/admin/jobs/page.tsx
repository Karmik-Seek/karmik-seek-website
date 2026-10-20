'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Job } from '@/lib/types';
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { LoadingSpinner, EmptyState } from '@/components/Feedback';

export default function AdminJobsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('Technology');
  const [jobType, setJobType] = useState('Internship');
  const [location, setLocation] = useState('Remote');
  const [remote, setRemote] = useState(true);
  const [salary, setSalary] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [deadline, setDeadline] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [description, setDescription] = useState('');

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadJobs();
  }, [user, authLoading, router]);

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setCompany('');
    setCategory('Technology');
    setJobType('Internship');
    setLocation('Remote');
    setRemote(true);
    setSalary('');
    setEligibility('');
    setDeadline('');
    setSkillsText('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (j: Job) => {
    setEditingJob(j);
    setTitle(j.title);
    setCompany(j.company);
    setCategory(j.category);
    setJobType(j.job_type);
    setLocation(j.location);
    setRemote(j.remote);
    setSalary(j.salary_or_stipend || '');
    setEligibility(j.eligibility || '');
    setDeadline(j.deadline ? j.deadline.split('T')[0] : '');
    setSkillsText((j.required_skills || []).join(', '));
    setDescription(j.description);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title,
      company,
      category,
      job_type: jobType,
      location,
      remote,
      salary_or_stipend: salary || undefined,
      eligibility: eligibility || undefined,
      deadline: deadline || undefined,
      required_skills: skillsArray,
      description,
    };

    try {
      if (editingJob) {
        const updated = await api.updateJob(editingJob.id, payload);
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? updated : j)));
        showToast('success', 'Job opportunity updated.');
      } else {
        const created = await api.createJob(payload);
        setJobs((prev) => [created, ...prev]);
        showToast('success', 'New student opportunity published.');
      }
      setShowModal(false);
    } catch (err: any) {
      showToast('error', err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      const updated = await api.updateJob(job.id, { status: newStatus });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      showToast('success', `Job marked as ${newStatus}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Status change failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this job listing?')) return;
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      showToast('success', 'Job listing deleted.');
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed.');
    }
  };

  if (authLoading || loading) return <LoadingSpinner label="Loading roles inventory..." />;

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--color-cream-300)' }}
        >
          <div>
            <h1
              className="text-h2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Role Postings Management
            </h1>
            <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
              Create, edit, toggle availability, and publish verified openings.
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary text-xs">
            <Plus size={15} /> Post New Role
          </button>
        </div>

        {/* Jobs Table / Cards */}
        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs created yet"
            description="Click 'Post New Role' to publish your first student hiring opportunity."
            action={{ label: 'Post a Role', onClick: openCreateModal }}
          />
        ) : (
          <div
            className="glass rounded-[var(--radius-card)] overflow-hidden divide-y"
            style={{
              borderColor: 'var(--color-cream-300)',
              border: '1px solid rgb(255 255 255 / 0.7)',
            }}
          >
            {jobs.map((j) => (
              <div
                key={j.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-black/[0.02] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={
                        j.status === 'active'
                          ? { background: 'var(--color-sage-100)', color: 'var(--color-sage-600)' }
                          : { background: 'var(--color-grey-100)', color: 'var(--color-grey-600)' }
                      }
                    >
                      {j.status.toUpperCase()}
                    </span>
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: 'var(--color-plum-100)', color: 'var(--color-plum-700)' }}
                    >
                      {j.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                      · {j.job_type}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                    {j.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    {j.company} · {j.remote ? 'Remote' : j.location} · {j.salary_or_stipend || 'Stipend undisclosed'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => toggleJobStatus(j)}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold border transition-all"
                    style={
                      j.status === 'active'
                        ? {
                            borderColor: 'var(--color-cream-300)',
                            color: 'var(--color-ink-muted)',
                            background: 'var(--color-cream-50)',
                          }
                        : {
                            borderColor: 'rgba(62, 123, 91, 0.4)',
                            background: 'var(--color-sage-100)',
                            color: 'var(--color-sage-600)',
                          }
                    }
                  >
                    {j.status === 'active' ? 'Close Listing' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => openEditModal(j)}
                    className="btn btn-secondary text-xs p-2"
                    title="Edit Role"
                    aria-label="Edit Role"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="btn btn-secondary text-xs p-2"
                    style={{ color: 'var(--color-wine-700)' }}
                    title="Delete Role"
                    aria-label="Delete Role"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Job Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-2xl rounded-[var(--radius-panel)] p-6 sm:p-7 shadow-pop space-y-4 my-auto"
              style={{
                background: 'var(--color-cream-50)',
                border: '1px solid var(--color-cream-300)',
              }}
            >
              <div
                className="flex items-start justify-between pb-3 border-b"
                style={{ borderColor: 'var(--color-cream-300)' }}
              >
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
                >
                  {editingJob ? 'Edit Job Opening' : 'Post New Student Role'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-black/5"
                  style={{ color: 'var(--color-grey-600)' }}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Role Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Full Stack Developer Intern"
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field text-xs"
                    >
                      {JOB_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="input-field text-xs"
                    >
                      {JOB_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru / Hybrid"
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Stipend / Salary
                    </label>
                    <input
                      type="text"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. ₹25,000 / month"
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs" style={{ color: 'var(--color-ink)' }}>
                      <input
                        type="checkbox"
                        checked={remote}
                        onChange={(e) => setRemote(e.target.checked)}
                        className="rounded"
                      />
                      Fully Remote Role
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                    Required Skills (Comma-separated for algorithmic match scoring)
                  </label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g. React, TypeScript, Python, FastAPI"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                    Eligibility Criteria
                  </label>
                  <input
                    type="text"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. Final or pre-final year engineering students"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                    Job Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail the duties, projects, and learning outcomes..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                <div
                  className="flex justify-end gap-2 pt-3 border-t"
                  style={{ borderColor: 'var(--color-cream-300)' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-xs"
                  >
                    {submitting ? 'Saving…' : editingJob ? 'Update Role' : 'Publish Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
