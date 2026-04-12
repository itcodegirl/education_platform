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
    const { data } = await authService.loadProfile(userId);
    setProfile(data);
  };

  // ─── Get initial session ──────────────────
  useEffect(() => {
    const init = async () => {
      const { data: u, error } = await authService.getInitialSession();
      if (error) {
        console.error('Auth session error:', error.message);
        setUser(null);
      } else {
        setUser(u);
        if (u) handleLoadProfile(u.id);
      }
      setLoading(false);
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
  // authService always returns { data, error } tuples, so no try/catch needed.
  const signIn = (email, password) =>
    authService.signInWithEmail(email, password);

  const signUp = (email, password, displayName) =>
    authService.signUpWithEmail(email, password, displayName);

  const handleGithub = () => authService.signInWithGithub();
  const handleGoogle = () => authService.signInWithGoogle();

  const handleSignOut = async () => {
    setProfile(null);
    const { error } = await authService.signOut();
    if (!error) setUser(null);
    return { error };
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
