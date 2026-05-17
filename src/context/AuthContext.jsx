// =================================================
// AUTH CONTEXT - State + hooks only
// All Supabase auth logic lives in services/authService.js
// =================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SUPABASE_CONFIG_ERROR_MESSAGE, getOptionalSupabaseBrowserConfig } from '../lib/supabaseConfig';

const AuthContext = createContext({
  user: null,
  profile: null,
  profileError: '',
  loading: true,
  profileLoading: false,
  refreshProfile: async () => null,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signInWithGithub: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  forgotPassword: async () => ({ data: null, error: null }),
  resendConfirmation: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  authBackendReady: true,
});

let authServicePromise = null;

function loadAuthService() {
  if (!authServicePromise) {
    authServicePromise = import('../services/authService');
  }
  return authServicePromise;
}

function createAuthUnavailableError(configError = null) {
  const error = new Error(configError?.userMessage || SUPABASE_CONFIG_ERROR_MESSAGE);
  error.code = configError?.code || 'supabase_client_unavailable';
  return error;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const authInitRequestRef = useRef(0);
  const profileRequestRef = useRef(0);
  const currentUserIdRef = useRef(null);
  const authBackendStatus = useMemo(() => getOptionalSupabaseBrowserConfig(), []);
  const authBackendReady = authBackendStatus.configured;
  const authUnavailableError = useMemo(
    () => createAuthUnavailableError(authBackendStatus.error),
    [authBackendStatus.error],
  );

  const handleLoadProfile = useCallback(async (userId) => {
    const requestId = profileRequestRef.current + 1;
    profileRequestRef.current = requestId;

    if (!authBackendReady || !userId) {
      setProfile(null);
      setProfileError('');
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError('');

    try {
      const authService = await loadAuthService();
      const data = await authService.loadProfile(userId);
      if (profileRequestRef.current !== requestId) return;
      setProfile(data);
      setProfileError('');
    } catch (err) {
      if (profileRequestRef.current !== requestId) return;
      setProfile(null);
      setProfileError(err?.message || 'Unable to verify your account profile.');
    } finally {
      if (profileRequestRef.current === requestId) {
        setProfileLoading(false);
      }
    }
  }, [authBackendReady]);

  useEffect(() => {
    if (!authBackendReady) {
      setUser(null);
      setProfile(null);
      setProfileError('');
      setProfileLoading(false);
      setLoading(false);
      return undefined;
    }

    let active = true;
    let initialSessionResolved = false;
    let subscription = { unsubscribe: () => {} };
    const requestId = authInitRequestRef.current + 1;
    authInitRequestRef.current = requestId;

    const applyAuthUser = (nextUser, { markInitialized = false } = {}) => {
      if (!active || authInitRequestRef.current !== requestId) return;
      const userChanged = nextUser?.id !== currentUserIdRef.current;
      currentUserIdRef.current = nextUser?.id ?? null;
      setUser(nextUser);
      if (userChanged) {
        void handleLoadProfile(nextUser?.id);
      }
      if (markInitialized || initialSessionResolved) {
        setLoading(false);
      }
    };

    const init = async () => {
      setLoading(true);

      try {
        const authService = await loadAuthService();
        if (!active || authInitRequestRef.current !== requestId) return;

        subscription = authService.onAuthStateChange((nextUser) => {
          applyAuthUser(nextUser);
        });

        const nextUser = await authService.getInitialSession();
        initialSessionResolved = true;
        applyAuthUser(nextUser, { markInitialized: true });
      } catch (err) {
        if (!active || authInitRequestRef.current !== requestId) return;
        initialSessionResolved = true;
        console.error('Auth session error:', err?.message ?? String(err));
        applyAuthUser(null, { markInitialized: true });
      } finally {
        initialSessionResolved = true;
        if (active && authInitRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authBackendReady, handleLoadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!authBackendReady) {
      return { data: null, error: authUnavailableError };
    }

    try {
      const authService = await loadAuthService();
      const { data, error } = await authService.signInWithEmail(email, password);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [authBackendReady, authUnavailableError]);

  const signUp = useCallback(async (email, password, displayName) => {
    if (!authBackendReady) {
      return { data: null, error: authUnavailableError };
    }

    try {
      const authService = await loadAuthService();
      const { data, error } = await authService.signUpWithEmail(email, password, displayName);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [authBackendReady, authUnavailableError]);

  const resendConfirmation = useCallback(async (email) => {
    if (!authBackendReady) {
      return { data: null, error: authUnavailableError };
    }

    try {
      const authService = await loadAuthService();
      const { data, error } = await authService.resendSignupConfirmation(email);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [authBackendReady, authUnavailableError]);

  const handleGithub = useCallback(async () => {
    if (!authBackendReady) {
      return { data: null, error: authUnavailableError };
    }

    try {
      const authService = await loadAuthService();
      const { data, error } = await authService.signInWithGithub();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [authBackendReady, authUnavailableError]);

  const handleGoogle = useCallback(async () => {
    if (!authBackendReady) {
      return { data: null, error: authUnavailableError };
    }

    try {
      const authService = await loadAuthService();
      const { data, error } = await authService.signInWithGoogle();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [authBackendReady, authUnavailableError]);

  const forgotPassword = useCallback(async (email) => {
    if (!authBackendReady) {
      return { data: null, error: authUnavailableError };
    }

    try {
      const authService = await loadAuthService();
      const { data, error } = await authService.requestPasswordReset(email);
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [authBackendReady, authUnavailableError]);

  const handleSignOut = useCallback(async () => {
    setProfile(null);
    setProfileError('');
    setProfileLoading(false);

    if (!authBackendReady) {
      setUser(null);
      return { error: null };
    }

    try {
      const authService = await loadAuthService();
      const { error } = await authService.signOut();
      if (!error) setUser(null);
      return { error };
    } catch (err) {
      return { error: err };
    }
  }, [authBackendReady]);

  const refreshProfile = useCallback(async () => {
    if (!authBackendReady || !user?.id) return null;
    return handleLoadProfile(user.id);
  }, [authBackendReady, handleLoadProfile, user]);

  const value = useMemo(() => ({
    user,
    profile,
    profileError,
    loading,
    profileLoading,
    refreshProfile,
    signUp,
    signIn,
    signInWithGithub: handleGithub,
    signInWithGoogle: handleGoogle,
    forgotPassword,
    resendConfirmation,
    signOut: handleSignOut,
    authBackendReady,
  }), [
    authBackendReady,
    forgotPassword,
    resendConfirmation,
    handleGithub,
    handleGoogle,
    handleSignOut,
    loading,
    profile,
    profileError,
    profileLoading,
    refreshProfile,
    signIn,
    signUp,
    user,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
