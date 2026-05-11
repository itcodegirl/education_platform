import { describe, expect, it } from 'vitest';
import {
  SUPABASE_CONFIG_ERROR_CODE,
  SupabaseConfigError,
  getOptionalSupabaseBrowserConfig,
  getSupabaseBrowserConfig,
} from './supabaseConfig';

describe('supabaseConfig', () => {
  it('returns null when browser Supabase env is incomplete', () => {
    expect(getOptionalSupabaseBrowserConfig({})).toBeNull();
    expect(getOptionalSupabaseBrowserConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' })).toBeNull();
  });

  it('normalizes configured browser Supabase values', () => {
    expect(getOptionalSupabaseBrowserConfig({
      VITE_SUPABASE_URL: ' https://example.supabase.co ',
      VITE_SUPABASE_ANON_KEY: ' anon-key ',
    })).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('throws a typed config error for strict callers', () => {
    expect(() => getSupabaseBrowserConfig({})).toThrow(SupabaseConfigError);

    try {
      getSupabaseBrowserConfig({});
    } catch (error) {
      expect(error.code).toBe(SUPABASE_CONFIG_ERROR_CODE);
    }
  });
});
