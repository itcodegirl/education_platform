export const supabaseAuthOptions = Object.freeze({
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
});

export const SUPABASE_CONFIG_ERROR_CODE = 'missing-supabase-browser-env';
export const SUPABASE_CONFIG_ERROR_MESSAGE =
  'Supabase is not configured for this browser build.';

export class SupabaseConfigError extends Error {
  constructor(message = SUPABASE_CONFIG_ERROR_MESSAGE) {
    super(message);
    this.name = 'SupabaseConfigError';
    this.code = SUPABASE_CONFIG_ERROR_CODE;
  }
}

function getImportMetaEnv() {
  return typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
}

function normalizeEnvString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getSupabaseBrowserConfig(env = getImportMetaEnv()) {
  const config = getOptionalSupabaseBrowserConfig(env);

  if (!config) {
    throw new SupabaseConfigError(
      'Missing Supabase environment variables. Create a .env file with:\n' +
      'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key'
    );
  }

  return config;
}

export function getOptionalSupabaseBrowserConfig(env = getImportMetaEnv()) {
  const url = normalizeEnvString(env?.VITE_SUPABASE_URL);
  const anonKey = normalizeEnvString(env?.VITE_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}
