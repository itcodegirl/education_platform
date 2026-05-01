import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserConfig, supabaseAuthOptions } from './supabaseConfig';

let cachedClient = null;
let cachedConfigKey = '';

export function getLazySupabaseClient(env) {
  const { url, anonKey } = getSupabaseBrowserConfig(env);
  const configKey = `${url}::${anonKey}`;

  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedClient = createClient(url, anonKey, {
      auth: supabaseAuthOptions,
    });
    cachedConfigKey = configKey;
  }

  return cachedClient;
}

export function resetLazySupabaseClientForTests() {
  cachedClient = null;
  cachedConfigKey = '';
}
