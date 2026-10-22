import { auth } from './firebase';

export const BACKEND_RENDER_URL = 'https://karmik-seek-backend.onrender.com';
export const BACKEND_LOCAL_URL = 'http://localhost:8000';

/**
 * Resolves the active Backend API base URL with the following priority:
 * 1. Explicit NEXT_PUBLIC_API_URL environment variable (configured in Vercel or .env.local)
 * 2. Browser runtime localStorage override ('karmik_api_url') for instant switching during local testing
 * 3. Primary Production Live Backend: https://karmik-seek-backend.onrender.com
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('karmik_api_url');
    if (custom) return custom.replace(/\/+$/, '');
  }

  return BACKEND_RENDER_URL;
}

// Developer browser helpers to easily switch backends during local testing
if (typeof window !== 'undefined') {
  (window as any).setKarmikBackend = (target: 'render' | 'local' | string) => {
    if (target === 'render') {
      localStorage.setItem('karmik_api_url', BACKEND_RENDER_URL);
      console.log(`[Kaarmik Seek] Switched to Render: ${BACKEND_RENDER_URL}`);
    } else if (target === 'local') {
      localStorage.setItem('karmik_api_url', BACKEND_LOCAL_URL);
      console.log(`[Kaarmik Seek] Switched to Localhost: ${BACKEND_LOCAL_URL}`);
    } else {
      localStorage.setItem('karmik_api_url', target);
      console.log(`[Kaarmik Seek] Switched to custom URL: ${target}`);
    }
    window.location.reload();
  };

  (window as any).resetKarmikBackend = () => {
    localStorage.removeItem('karmik_api_url');
    console.log('[Kaarmik Seek] Reset to default API URL');
    window.location.reload();
  };
}

export const API_BASE_URL = BACKEND_RENDER_URL;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

export function getClientCached<T>(key: string, maxAgeMs: number = 45000): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setClientCached<T>(key: string, data: T) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateClientCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }
}

async function getAuthHeader(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    } catch (e) {
      console.warn('Failed to obtain Firebase ID token', e);
    }
  }

  // Fallback token in localStorage for direct/admin login
  if (typeof window !== 'undefined') {
    const fallbackToken = localStorage.getItem('karmik_auth_token');
    if (fallbackToken) {
      headers['Authorization'] = `Bearer ${fallbackToken}`;
    }
  }
  return headers;
}

export const api = {
  get baseUrl() {
    return getApiBaseUrl();
  },

  /**
   * Silent, non-blocking pre-warm ping to spin up asleep Render instances early
   * when landing, login, or register pages mount.
   */
  warmup() {
    if (typeof window === 'undefined') return;
    try {
      fetch(`${getApiBaseUrl()}/api/health`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        keepalive: true,
      }).catch(() => {
        // Silent catch: prewarm failure should never disrupt the client
      });
    } catch {
      // ignore
    }
  },

  async ping() {
    const res = await fetch(`${getApiBaseUrl()}/ping`);
    return res.json();
  },

  // Auth
  async loginFallback(email: string, pass: string) {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/login-fallback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  /**
   * Fast user sync with 12s timeout and 1 automatic retry on cold start network error.
   */
  async syncUser(
    userData: { firebase_uid: string; email: string; full_name?: string; auth_provider?: string },
    attempt: number = 1
  ): Promise<{ user: any; profile: any }> {
    const headers = await getAuthHeader();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to sync user');
      }
      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Auto-retry once on network timeout or cold start drop
      if (
        attempt < 2 &&
        (err.name === 'AbortError' ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('timeout'))
      ) {
        await new Promise((r) => setTimeout(r, 600));
        return this.syncUser(userData, attempt + 1);
      }
      throw err;
    }
  },

  async getMe() {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, { headers });
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  },

  // Student Profile & Resume
  async getProfile(forceRefresh: boolean = false) {
    const cacheKey = 'student_profile';
    if (!forceRefresh) {
      const cached = getClientCached<any>(cacheKey, 60000);
      if (cached) return cached;
    }
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/student/profile`, { headers });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async updateProfile(profileData: Record<string, any>) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/student/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update profile');
    }
    invalidateClientCache('student_profile');
    return res.json();
  },

  async uploadResume(file: File) {
    const currentUser = auth.currentUser;
    const headers: Record<string, string> = {};
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${getApiBaseUrl()}/api/student/resume`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload resume');
    }
    invalidateClientCache('student_profile');
    invalidateClientCache('admin_users');
    return res.json();
  },

  async getMyResumeLink(): Promise<{ url: string }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/student/resume/me/link`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to retrieve resume download link');
    }
    return res.json();
  },

  async getApplicantResumeLink(appId: string): Promise<{ url: string }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/admin/applicants/${appId}/resume-link`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to retrieve applicant resume link');
    }
    return res.json();
  },

  async getUserResumeLink(userId: string): Promise<{ url: string }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/resume-link`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to retrieve user resume link');
    }
    return res.json();
  },

  getResumeUrl(relativeUrl: string) {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return `${getApiBaseUrl()}${relativeUrl}`;
  },

  // Jobs
  async getJobs(params?: { search?: string; category?: string; job_type?: string; remote?: boolean }, forceRefresh: boolean = false) {
    const cacheKey = `jobs_${JSON.stringify(params || {})}`;
    if (!forceRefresh) {
      const cached = getClientCached<any[]>(cacheKey, 30000);
      if (cached) return cached;
    }

    const headers = await getAuthHeader();
    const url = new URL(`${getApiBaseUrl()}/api/jobs`);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.category) url.searchParams.set('category', params.category);
    if (params?.job_type) url.searchParams.set('job_type', params.job_type);
    if (params?.remote) url.searchParams.set('remote', 'true');

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async getJob(id: string) {
    const cacheKey = `job_${id}`;
    const cached = getClientCached<any>(cacheKey, 60000);
    if (cached) return cached;

    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/jobs/${id}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch job details');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async createJob(jobData: Record<string, any>) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(jobData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create job');
    }
    invalidateClientCache('jobs');
    invalidateClientCache('admin_stats');
    return res.json();
  },

  async updateJob(id: string, jobData: Record<string, any>) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/jobs/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(jobData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update job');
    }
    invalidateClientCache('jobs');
    invalidateClientCache('admin_stats');
    invalidateClientCache(`job_${id}`);
    return res.json();
  },

  async deleteJob(id: string) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/jobs/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete job');
    invalidateClientCache('jobs');
    invalidateClientCache('admin_stats');
    return res.json();
  },

  // Applications
  async applyToJob(jobId: string, coverLetter?: string) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to apply');
    }
    invalidateClientCache('my_applications');
    invalidateClientCache('admin_applicants');
    invalidateClientCache('admin_stats');
    return res.json();
  },

  async getMyApplications(forceRefresh: boolean = false) {
    const cacheKey = 'my_applications';
    if (!forceRefresh) {
      const cached = getClientCached<any[]>(cacheKey, 30000);
      if (cached) return cached;
    }

    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/applications/my`, { headers });
    if (!res.ok) throw new Error('Failed to fetch applications');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async withdrawApplication(appId: string) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/applications/${appId}/withdraw`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to withdraw application');
    invalidateClientCache('my_applications');
    invalidateClientCache('admin_applicants');
    invalidateClientCache('admin_stats');
    return res.json();
  },

  // Admin
  async getAdminStats(forceRefresh: boolean = false) {
    const cacheKey = 'admin_stats';
    if (!forceRefresh) {
      const cached = getClientCached<any>(cacheKey, 30000);
      if (cached) return cached;
    }

    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/admin/stats`, { headers });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async getAdminApplicants(params?: { job_id?: string; status?: string }, forceRefresh: boolean = false) {
    const cacheKey = `admin_applicants_${JSON.stringify(params || {})}`;
    if (!forceRefresh) {
      const cached = getClientCached<any[]>(cacheKey, 20000);
      if (cached) return cached;
    }

    const headers = await getAuthHeader();
    const url = new URL(`${getApiBaseUrl()}/api/admin/applicants`);
    if (params?.job_id) url.searchParams.set('job_id', params.job_id);
    if (params?.status) url.searchParams.set('status', params.status);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error('Failed to fetch applicants');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async updateApplicantStatus(appId: string, status: string, note?: string, interviewDetails?: Record<string, any>) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/admin/applicants/${appId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status,
        note,
        interview_details: interviewDetails,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update applicant status');
    }
    invalidateClientCache('admin_applicants');
    invalidateClientCache('admin_stats');
    return res.json();
  },

  async getAdminUsers(params?: { search?: string; role?: string; has_resume?: boolean }, forceRefresh: boolean = false) {
    const cacheKey = `admin_users_${JSON.stringify(params || {})}`;
    if (!forceRefresh) {
      const cached = getClientCached<any[]>(cacheKey, 30000);
      if (cached) return cached;
    }

    const headers = await getAuthHeader();
    const url = new URL(`${getApiBaseUrl()}/api/admin/users`);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.role) url.searchParams.set('role', params.role);
    if (params?.has_resume !== undefined) url.searchParams.set('has_resume', String(params.has_resume));

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error('Failed to fetch users directory');
    const data = await res.json();
    setClientCached(cacheKey, data);
    return data;
  },

  async getAdminUserDetails(userId: string) {
    const headers = await getAuthHeader();
    const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch user dossier');
    return res.json();
  },
};
