import { describe, expect, it } from 'vitest';
import {
  SUPABASE_CONFIG_ERROR_CODE,
  SupabaseConfigError,
  getOptionalSupabaseBrowserConfig,
  getSupabaseBrowserConfig,
} from './supabaseConfig';

describe('supabase config', () => {
  it('throws a typed setup error when required browser env is missing', () => {
    expect(() => getSupabaseBrowserConfig({})).toThrow(SupabaseConfigError);

    try {
      getSupabaseBrowserConfig({});
    } catch (error) {
      expect(error.code).toBe(SUPABASE_CONFIG_ERROR_CODE);
      expect(error.userMessage).toMatch(/accounts are not connected/i);
    }
  });

  it('supports a fail-soft status for public screens', () => {
    const result = getOptionalSupabaseBrowserConfig({});

    expect(result.configured).toBe(false);
    expect(result.error.code).toBe(SUPABASE_CONFIG_ERROR_CODE);
    expect(result.url).toBe('');
    expect(result.anonKey).toBe('');
  });

  it('returns normalized config when env values are present', () => {
    expect(getOptionalSupabaseBrowserConfig({
      VITE_SUPABASE_URL: ' https://example.supabase.co ',
      VITE_SUPABASE_ANON_KEY: ' anon-key ',
    })).toMatchObject({
      configured: true,
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
      error: null,
    });
  });
});
