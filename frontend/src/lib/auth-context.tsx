'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase user with MongoDB Atlas backend
  const syncWithBackend = async (fbUser: FirebaseUser, customName?: string, providerName?: string) => {
    try {
      const syncResult = await api.syncUser({
        firebase_uid: fbUser.uid,
        email: fbUser.email || '',
        full_name: customName || fbUser.displayName || '',
        auth_provider: providerName || (fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'),
      });
      setUser(syncResult.user);
      setProfile(syncResult.profile);
      return syncResult.user;
    } catch (err) {
      console.error('Error syncing user with backend:', err);
      // Fallback basic user object
      const fallbackUser: User = {
        id: fbUser.uid,
        firebase_uid: fbUser.uid,
        email: fbUser.email || '',
        full_name: customName || fbUser.displayName || fbUser.email?.split('@')[0] || '',
        role: fbUser.email?.toLowerCase() === 'prajwalganiga06@gmail.com' ? 'admin' : 'student',
        auth_provider: 'firebase',
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    // Check fallback session in localStorage if no Firebase session yet
    if (typeof window !== 'undefined') {
      const fallbackToken = localStorage.getItem('karmik_auth_token');
      if (fallbackToken && !firebaseUser) {
        api.getMe()
          .then((res) => {
            setUser(res.user);
            setProfile(res.profile);
          })
          .catch(() => {
            localStorage.removeItem('karmik_auth_token');
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncWithBackend(fbUser);
      } else {
        const fallbackToken = typeof window !== 'undefined' ? localStorage.getItem('karmik_auth_token') : null;
        if (!fallbackToken) {
          setUser(null);
          setProfile(null);
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
      const syncedUser = await syncWithBackend(res.user, res.user.displayName || undefined, 'google');
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
      const syncedUser = await syncWithBackend(res.user, undefined, 'password');
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
          setUser(fallbackRes.user);
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
      const syncedUser = await syncWithBackend(res.user, name, 'password');
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
    await firebaseSignOut(auth).catch(() => {});
    setUser(null);
    setProfile(null);
    setFirebaseUser(null);
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
