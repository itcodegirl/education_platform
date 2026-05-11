// AUTH SERVICE - All Supabase auth operations
// Context calls these; this file owns the DB logic.

import { getOptionalSupabaseBrowserConfig } from '../lib/supabaseConfig';

let supabaseClientPromise = null;

async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('../lib/lazySupabaseClient')
      .then((module) => module.getLazySupabaseClient());
  }

  return supabaseClientPromise;
}

export function isAuthBackendConfigured() {
  return getOptionalSupabaseBrowserConfig().configured;
}

export async function getInitialSession() {
  const supabase = await getSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user ?? null;
}

export function onAuthStateChange(callback) {
  let unsubscribed = false;
  let activeSubscription = null;

  const subscription = {
    unsubscribe() {
      unsubscribed = true;
      activeSubscription?.unsubscribe?.();
    },
  };

  void getSupabaseClient()
    .then((supabase) => {
      if (unsubscribed) return;

      const { data: { subscription: nextSubscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => callback(session?.user ?? null),
      );

      activeSubscription = nextSubscription;

      if (unsubscribed) {
        activeSubscription?.unsubscribe?.();
      }
    })
    .catch(() => {
      // Initial session restoration still runs through getInitialSession().
      // If the client fails to load here, keeping a no-op subscription is
      // less disruptive than throwing during provider mount.
    });

  return subscription;
}

export async function loadProfile(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, is_admin, is_disabled')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function signInWithEmail(email, password) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(
  email,
  password,
  displayName,
) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  return { data, error };
}

export async function signInWithGithub() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return { data, error };
}

export async function requestPasswordReset(email) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { data, error };
}

export async function signOut() {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
