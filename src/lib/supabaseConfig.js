export const supabaseAuthOptions = Object.freeze({
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
});

export const SUPABASE_CONFIG_ERROR_CODE = 'missing_supabase_config';

export const SUPABASE_CONFIG_ERROR_MESSAGE =
  'CodeHerWay accounts are not connected in this environment. Add ' +
  'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign in and progress sync.';

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      'Missing Supabase environment variables. Create a .env file with:\n' +
      'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key'
    );
    this.name = 'SupabaseConfigError';
    this.code = SUPABASE_CONFIG_ERROR_CODE;
    this.userMessage = SUPABASE_CONFIG_ERROR_MESSAGE;
  }
}

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
    throw new SupabaseConfigError();
  }

  return { url, anonKey };
}

export function getOptionalSupabaseBrowserConfig(env = getImportMetaEnv()) {
  try {
    return {
      ...getSupabaseBrowserConfig(env),
      configured: true,
      error: null,
    };
  } catch (error) {
    if (error?.code !== SUPABASE_CONFIG_ERROR_CODE) {
      throw error;
    }

    return {
      url: '',
      anonKey: '',
      configured: false,
      error,
    };
  }
}
