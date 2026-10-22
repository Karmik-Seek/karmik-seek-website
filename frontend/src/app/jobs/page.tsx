'use client';

import React, { useEffect, useState } from 'react';
import { Search, Briefcase, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Job } from '@/lib/types';
import { JOB_CATEGORIES, JOB_TYPES } from '@/lib/types';
import JobCard from '@/components/JobCard';
import { LoadingSpinner, EmptyState } from '@/components/Feedback';
import { useAuth } from '@/lib/auth-context';

export default function JobDiscoveryPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        job_type: selectedType !== 'All' ? selectedType : undefined,
        remote: remoteOnly || undefined,
      });
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, selectedType, remoteOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedType('All');
    setRemoteOnly(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'All' || selectedType !== 'All' || remoteOnly || search.trim();

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:px-6 lg:px-8"
      style={{ background: 'var(--color-cream-100)' }}
    >
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--color-cream-300)' }}>
          <div>
            <h1 className="text-h2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              Open roles
            </h1>
            <p className="mt-1 text-base" style={{ color: 'var(--color-ink-muted)' }}>
              Verified internships, part-time jobs, and campus contracts matched to your skills.
            </p>
          </div>

          {user?.role === 'student' && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{
                background: 'var(--color-plum-50)',
                border: '1px solid var(--color-plum-200)',
                color: 'var(--color-plum-700)',
              }}
            >
              <Sparkles size={15} />
              Match scores computed from your profile
            </div>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              size={17}
              style={{ color: 'var(--color-grey-500)' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role title, company or skill…"
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              aria-label="Search jobs"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary text-sm shrink-0"
            aria-label="Search"
          >
            Search
          </button>
        </form>

        {/* Filter chips */}
        <div className="space-y-3">
          {/* Category */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-ink-muted)' }}>
              Category
            </span>
            {['All', ...JOB_CATEGORIES].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full px-3.5 py-1 text-xs font-medium transition-all shrink-0"
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
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Job type + remote */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-ink-muted)' }}>
              Type
            </span>
            {['All', ...JOB_TYPES].map((type) => {
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className="rounded-full px-3.5 py-1 text-xs font-medium transition-all shrink-0"
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

            <label
              className="ml-auto flex items-center gap-2 cursor-pointer text-xs font-medium rounded-full px-3.5 py-1"
              style={{
                background: remoteOnly ? 'var(--color-plum-700)' : 'var(--color-cream-50)',
                border: remoteOnly ? 'none' : '1px solid var(--color-cream-300)',
                color: remoteOnly ? '#fff' : 'var(--color-ink-muted)',
              }}
            >
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="sr-only"
              />
              Remote only
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: 'var(--color-wine-700)' }}
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {jobs.length === 0
              ? 'No roles match these filters.'
              : `Showing ${jobs.length} open ${jobs.length === 1 ? 'role' : 'roles'}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="glass rounded-[var(--radius-card)] p-5 space-y-3 animate-pulse"
                style={{ border: '1px solid rgb(255 255 255 / 0.7)' }}
              >
                <div className="flex justify-between items-start">
                  <div className="h-5 w-3/4 bg-black/10 rounded" />
                  <div className="h-4 w-12 bg-black/10 rounded-full" />
                </div>
                <div className="h-4 w-1/2 bg-black/10 rounded" />
                <div className="h-3 w-1/3 bg-black/5 rounded" />
                <div className="pt-2 flex gap-1.5">
                  <div className="h-5 w-14 bg-black/10 rounded-full" />
                  <div className="h-5 w-16 bg-black/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No roles found"
            description="Try broadening your search or removing a filter."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
