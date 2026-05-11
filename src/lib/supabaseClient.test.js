import { afterEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CONFIG_ERROR_CODE } from './supabaseConfig';

describe('supabaseClient fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps public imports safe when browser Supabase env is missing', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const { supabase, supabaseConfigStatus } = await import('./supabaseClient');

    expect(supabaseConfigStatus.configured).toBe(false);
    expect(supabaseConfigStatus.error.code).toBe(SUPABASE_CONFIG_ERROR_CODE);

    await expect(supabase.auth.getSession()).resolves.toEqual({
      data: { session: null },
      error: null,
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: 'learner@example.com',
      password: 'password',
    });
    expect(error.code).toBe(SUPABASE_CONFIG_ERROR_CODE);
  });
});
