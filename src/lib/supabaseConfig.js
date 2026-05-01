export const supabaseAuthOptions = Object.freeze({
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
});

function getImportMetaEnv() {
  return typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
}

function normalizeEnvString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getSupabaseBrowserConfig(env = getImportMetaEnv()) {
  const url = normalizeEnvString(env?.VITE_SUPABASE_URL);
  const anonKey = normalizeEnvString(env?.VITE_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Create a .env file with:\n' +
      'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key'
    );
  }

  return { url, anonKey };
}
