import { afterEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CONFIG_ERROR_CODE } from './supabaseConfig';

describe('supabaseClient fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@supabase/supabase-js');
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

  it('reuses the lazy browser client when env is configured', async () => {
    const client = {
      auth: {
        getSession: vi.fn(),
      },
    };
    const createClient = vi.fn(() => client);

    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    vi.doMock('@supabase/supabase-js', () => ({ createClient }));

    const [{ supabase }, { getLazySupabaseClient }] = await Promise.all([
      import('./supabaseClient'),
      import('./lazySupabaseClient'),
    ]);

    expect(supabase).toBe(client);
    expect(getLazySupabaseClient()).toBe(client);
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
