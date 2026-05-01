// ═══════════════════════════════════════════════
// AUTH CONTEXT — State + hooks only
// All Supabase logic lives in services/authService.js
// ═══════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signInWithGithub: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  forgotPassword: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const authInitRequestRef = useRef(0);
  const profileRequestRef = useRef(0);

  // ─── Load profile ──────────────────────────
  const handleLoadProfile = useCallback(async (userId) => {
    const requestId = profileRequestRef.current + 1;
    profileRequestRef.current = requestId;

    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const data = await authService.loadProfile(userId);
      if (profileRequestRef.current !== requestId) return;
      setProfile(data);
    } catch {
      if (profileRequestRef.current !== requestId) return;
      setProfile(null);
    } finally {
      if (profileRequestRef.current === requestId) {
        setProfileLoading(false);
      }
    }
  }, []);

  // Auth restoration and auth-change events share one guarded path.
  useEffect(() => {
    let active = true;
    let initialSessionResolved = false;
    const requestId = authInitRequestRef.current + 1;
    authInitRequestRef.current = requestId;

    const applyAuthUser = (nextUser, { markInitialized = false } = {}) => {
      if (!active || authInitRequestRef.current !== requestId) return;
      setUser(nextUser);
      handleLoadProfile(nextUser?.id);
      if (markInitialized || initialSessionResolved) {
        setLoading(false);
      }
    };

    const init = async () => {
      setLoading(true);
      try {
        const u = await authService.getInitialSession();
        initialSessionResolved = true;
        applyAuthUser(u, { markInitialized: true });
      } catch (err) {
        if (!active || authInitRequestRef.current !== requestId) return;
        initialSessionResolved = true;
        console.error('Auth session error:', err.message);
        applyAuthUser(null, { markInitialized: true });
      } finally {
        initialSessionResolved = true;
        if (active && authInitRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    const subscription = authService.onAuthStateChange((u) => {
      applyAuthUser(u);
    });

    init();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [handleLoadProfile]);

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

  const forgotPassword = async (email) => {
    try {
      const { data, error } = await authService.requestPasswordReset(email);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const handleSignOut = async () => {
    setProfile(null);
    setProfileLoading(false);
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
    user, profile, loading, profileLoading,
    signUp, signIn,
    signInWithGithub: handleGithub,
    signInWithGoogle: handleGoogle,
    forgotPassword,
    signOut: handleSignOut,
  }), [user, profile, loading, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
