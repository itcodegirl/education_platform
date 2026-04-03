// ═══════════════════════════════════════════════
// AUTH CONTEXT — Supabase Authentication + Profile
// ═══════════════════════════════════════════════

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Load profile from Supabase ───────────
  const loadProfile = async (userId) => {
    if (!userId) { setProfile(null); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, is_admin, is_disabled')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data || null);
    } catch (err) {
      console.error("Profile load error:", err.message);
      setProfile(null);
    }
  };

  // ─── Get initial session ──────────────────
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
        if (data.user) loadProfile(data.user.id);
      } catch (err) {
        console.error("Auth error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  // ─── Listen for auth changes ──────────────
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) loadProfile(u.id);
        else setProfile(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ─── Auth actions ─────────────────────────
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Login error:", err.message);
      return { error: err.message };
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("Signup error:", err.message);
      return { data: null, error: err };
    }
  };

  const signInWithGithub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("GitHub auth error:", err.message);
      return { error: err.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Google auth error:", err.message);
      return { error: err.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  // ─── Memoized value ──────────────────────
  const value = useMemo(() => ({
    user,
    profile,
    loading,
    login,
    signIn: login,
    signUp,
    signInWithGithub,
    signInWithGoogle,
    signOut: logout,
  }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
