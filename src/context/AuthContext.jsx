// ═══════════════════════════════════════════════
// AUTH CONTEXT — State + hooks only
// All Supabase logic lives in services/authService.js
// ═══════════════════════════════════════════════

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signInWithGithub: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Load profile ──────────────────────────
  const handleLoadProfile = async (userId) => {
    if (!userId) { setProfile(null); return; }
    try {
      const data = await authService.loadProfile(userId);
      setProfile(data);
    } catch {
      setProfile(null);
    }
  };

  // ─── Get initial session ──────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const u = await authService.getInitialSession();
        setUser(u);
        if (u) handleLoadProfile(u.id);
      } catch (err) {
        console.error('Auth session error:', err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ─── Listen for auth changes ──────────────
  useEffect(() => {
    const subscription = authService.onAuthStateChange((u) => {
      setUser(u);
      if (u) handleLoadProfile(u.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth actions (thin wrappers) ─────────
  const signIn = async (email, password) => {
    try {
      const { data, error } = await authService.signInWithEmail(email, password);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      const { data, error } = await authService.signUpWithEmail(email, password, displayName);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const handleGithub = async () => {
    try {
      const { data, error } = await authService.signInWithGithub();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const handleGoogle = async () => {
    try {
      const { data, error } = await authService.signInWithGoogle();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const handleSignOut = async () => {
    setProfile(null);
    try {
      const { error } = await authService.signOut();
      if (!error) setUser(null);
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  // ─── Memoized value ──────────────────────
  const value = useMemo(() => ({
    user, profile, loading,
    signUp, signIn,
    signInWithGithub: handleGithub,
    signInWithGoogle: handleGoogle,
    signOut: handleSignOut,
  }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
