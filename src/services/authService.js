// ═══════════════════════════════════════════════
// AUTH SERVICE — All Supabase auth operations
// Context calls these; this file owns the DB logic.
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';

export async function getInitialSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user ?? null;
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session?.user ?? null)
  );
  return subscription;
}

export async function loadProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, is_admin, is_disabled')
    .eq('id', userId)
    .maybeSingle();
  return data || null;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } },
  });
  return { data, error };
}

export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
