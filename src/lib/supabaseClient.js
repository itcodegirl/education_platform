import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserConfig, supabaseAuthOptions } from './supabaseConfig';

const { url, anonKey } = getSupabaseBrowserConfig();

export const supabase = createClient(url, anonKey, {
  auth: supabaseAuthOptions,
});
