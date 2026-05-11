import { createClient } from '@supabase/supabase-js';
import { supabaseAuthOptions } from './supabaseConfig';

const browserClientCache = new Map();

function getConfigKey({ url, anonKey }) {
  return `${url}::${anonKey}`;
}

export function getCachedSupabaseBrowserClient(config) {
  const configKey = getConfigKey(config);
  const cachedClient = browserClientCache.get(configKey);

  if (cachedClient) return cachedClient;

  const client = createClient(config.url, config.anonKey, {
    auth: supabaseAuthOptions,
  });
  browserClientCache.set(configKey, client);
  return client;
}

export function resetSupabaseBrowserClientCacheForTests() {
  browserClientCache.clear();
}
