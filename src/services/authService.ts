// ═══════════════════════════════════════════════
// AUTH SERVICE — All Supabase auth operations
// Context calls these; this file owns the DB logic.
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';
import type { Profile, UUID } from './supabaseTypes';

type SupabaseAuthUser = Awaited<
  ReturnType<typeof supabase.auth.getUser>
>['data']['user'];

export async function getInitialSession(): Promise<SupabaseAuthUser | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user ?? null;
}

type AuthChangeCallback = (user: SupabaseAuthUser | null) => void;

export function onAuthStateChange(callback: AuthChangeCallback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session?.user ?? null),
  );
  return subscription;
}

export async function loadProfile(userId: UUID): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, is_admin, is_disabled')
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile | null) || null;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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

export async function requestPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
