import { getSupabaseBrowserConfig } from './supabaseConfig';
import {
  getCachedSupabaseBrowserClient,
  resetSupabaseBrowserClientCacheForTests,
} from './supabaseBrowserClient';

export function getLazySupabaseClient(env) {
  return getCachedSupabaseBrowserClient(getSupabaseBrowserConfig(env));
}

export function resetLazySupabaseClientForTests() {
  resetSupabaseBrowserClientCacheForTests();
}
