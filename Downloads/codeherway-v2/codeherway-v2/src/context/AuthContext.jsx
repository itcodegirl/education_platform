// ═══════════════════════════════════════════════
// AUTH CONTEXT — Supabase Authentication + Profile
// Handles signup, login, logout, session, profile loading
// ═══════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Supabase
  async function loadProfile(userId) {
    if (!userId) { setProfile(null); return; }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, is_admin, is_disabled')
        .eq('id', userId)
        .single();
      setProfile(data || null);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) loadProfile(u.id);
        else setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: displayName } },
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signInWithGithub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin },
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    setProfile(null);
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const value = useMemo(() => ({
    user, profile, loading,
    signUp, signIn, signInWithGithub, signInWithGoogle, signOut,
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
