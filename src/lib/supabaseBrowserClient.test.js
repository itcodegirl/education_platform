import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('supabase browser client cache', () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
    mockCreateClient.mockImplementation((url, anonKey) => ({
      id: `${url}:${anonKey}`,
      auth: {},
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('shares one configured client between eager and lazy import paths', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://codeherway.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const { supabase } = await import('./supabaseClient');
    const { getLazySupabaseClient } = await import('./lazySupabaseClient');

    expect(getLazySupabaseClient()).toBe(supabase);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://codeherway.supabase.co',
      'anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }),
      }),
    );
  });

  it('resets the shared cache for tests', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://codeherway.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const { getLazySupabaseClient, resetLazySupabaseClientForTests } = await import('./lazySupabaseClient');

    const firstClient = getLazySupabaseClient();
    resetLazySupabaseClientForTests();
    const secondClient = getLazySupabaseClient();

    expect(secondClient).not.toBe(firstClient);
    expect(mockCreateClient).toHaveBeenCalledTimes(2);
  });
});
