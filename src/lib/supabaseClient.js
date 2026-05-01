// ═══════════════════════════════════════════════
// SUPABASE CLIENT — Single instance for the app
// ═══════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Create a .env file with:\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabaseAuthOptions = Object.freeze({
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: supabaseAuthOptions,
});
