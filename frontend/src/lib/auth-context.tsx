'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type FirebaseUser
} from './firebase';
import { api } from './api';
import type { User, StudentProfile } from './types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<User>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CACHED_USER_KEY = 'karmik_cached_user';

function getInitialCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHED_USER_KEY);
    if (raw) {
      return JSON.parse(raw) as User;
    }
  } catch {
    // ignore parse or storage errors
  }
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(getInitialCachedUser);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  // If we already have a cached user, we can immediately declare loading: false for initial layout render
  const [loading, setLoading] = useState<boolean>(() => !getInitialCachedUser());

  // Ref to deduplicate concurrent in-flight sync requests (e.g. login handler + onAuthStateChanged)
  const syncPromiseRef = useRef<Promise<User> | null>(null);
  const lastSyncedUidRef = useRef<string | null>(null);

  const updateUserCache = (u: User | null) => {
    setUser(u);
    if (typeof window !== 'undefined') {
      try {
        if (u) {
          sessionStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
        } else {
          sessionStorage.removeItem(CACHED_USER_KEY);
        }
      } catch {
        // ignore storage errors
      }
    }
  };

  // Sync Firebase user with MongoDB Atlas backend (deduplicated & cached)
  const syncWithBackend = async (
    fbUser: FirebaseUser,
    customName?: string,
    providerName?: string,
    force: boolean = false
  ): Promise<User> => {
    // If not forced and already synced this exact UID and have user in state, return it
    if (!force && lastSyncedUidRef.current === fbUser.uid && user) {
      return user;
    }

    // If an identical sync is already in flight, reuse its promise
    if (syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    const currentPromise = (async () => {
      try {
        const syncResult = await api.syncUser({
          firebase_uid: fbUser.uid,
          email: fbUser.email || '',
          full_name: customName || fbUser.displayName || '',
          auth_provider: providerName || (fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'),
        });

        updateUserCache(syncResult.user);
        if (syncResult.profile) {
          setProfile(syncResult.profile);
        }
        lastSyncedUidRef.current = fbUser.uid;
        return syncResult.user;
      } catch (err) {
        console.error('Error syncing user with backend:', err);
        // Fallback basic user object to prevent hard crash if backend is temporarily unreachable
        const fallbackUser: User = {
          id: fbUser.uid,
          firebase_uid: fbUser.uid,
          email: fbUser.email || '',
          full_name: customName || fbUser.displayName || fbUser.email?.split('@')[0] || '',
          role: fbUser.email?.toLowerCase() === 'prajwalganiga06@gmail.com' ? 'admin' : 'student',
          auth_provider: 'firebase',
        };
        updateUserCache(fallbackUser);
        lastSyncedUidRef.current = fbUser.uid;
        return fallbackUser;
      } finally {
        syncPromiseRef.current = null;
      }
    })();

    syncPromiseRef.current = currentPromise;
    return currentPromise;
  };

  useEffect(() => {
    // Fallback token in localStorage for direct/admin password bypass
    if (typeof window !== 'undefined') {
      const fallbackToken = localStorage.getItem('karmik_auth_token');
      if (fallbackToken && !firebaseUser && !user) {
        api.getMe()
          .then((res) => {
            updateUserCache(res.user);
            setProfile(res.profile);
            setLoading(false);
          })
          .catch(() => {
            localStorage.removeItem('karmik_auth_token');
            setLoading(false);
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Only run sync if not already synced by the explicit login action
        if (lastSyncedUidRef.current !== fbUser.uid) {
          await syncWithBackend(fbUser);
        }
      } else {
        const fallbackToken = typeof window !== 'undefined' ? localStorage.getItem('karmik_auth_token') : null;
        if (!fallbackToken) {
          updateUserCache(null);
          setProfile(null);
          lastSyncedUidRef.current = null;
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User> => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      // Explicitly await fast sync and update cache before returning
      const syncedUser = await syncWithBackend(res.user, res.user.displayName || undefined, 'google', true);
      setLoading(false);
      return syncedUser;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    const cleanEmail = email.trim();
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const syncedUser = await syncWithBackend(res.user, undefined, 'password', true);
      setLoading(false);
      return syncedUser;
    } catch (err: any) {
      // Auto-fallback: If Firebase returns configuration-not-found, user-not-found, or for seeded admin accounts
      const isAdminEmail = ['prajwalganiga06@gmail.com', 'testathri@gmail.com'].includes(cleanEmail.toLowerCase());
      if (
        isAdminEmail ||
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/user-not-found'
      ) {
        try {
          const fallbackRes = await api.loginFallback(cleanEmail, pass);
          if (typeof window !== 'undefined' && fallbackRes.token) {
            localStorage.setItem('karmik_auth_token', fallbackRes.token);
          }
          updateUserCache(fallbackRes.user);
          setProfile(fallbackRes.profile);
          setLoading(false);
          return fallbackRes.user;
        } catch (fallbackErr: any) {
          setLoading(false);
          throw new Error(fallbackErr.message || 'Login failed. Please verify credentials.');
        }
      }
      setLoading(false);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const syncedUser = await syncWithBackend(res.user, name, 'password', true);
      setLoading(false);
      return syncedUser;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!email) throw new Error('Please enter your email address to reset password.');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('karmik_auth_token');
    }
    updateUserCache(null);
    setProfile(null);
    setFirebaseUser(null);
    lastSyncedUidRef.current = null;
    await firebaseSignOut(auth).catch(() => {});
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const prof = await api.getProfile();
      setProfile(prof);
    } catch (e) {
      console.warn('Could not refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        profile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
