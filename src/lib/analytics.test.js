import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flushAnalyticsQueue,
  isAnalyticsConfigured,
  isAnalyticsDebugEnabled,
  trackEvent,
} from './analytics';

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: vi.fn((key) => (entries.has(key) ? entries.get(key) : null)),
    setItem: vi.fn((key, value) => entries.set(key, String(value))),
    removeItem: vi.fn((key) => entries.delete(key)),
  };
}

describe('analytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('keeps analytics disabled unless explicitly configured', () => {
    expect(isAnalyticsConfigured({})).toBe(false);
    expect(isAnalyticsConfigured({
      VITE_ANALYTICS_ENABLED: 'false',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon',
    })).toBe(false);
    expect(isAnalyticsConfigured({
      VITE_ANALYTICS_ENABLED: 'true',
    })).toBe(false);
  });

  it('accepts explicit true analytics flags with browser Supabase config', () => {
    ['true', 'TRUE', ' true '].forEach((flagValue) => {
      expect(isAnalyticsConfigured({
        VITE_ANALYTICS_ENABLED: flagValue,
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon',
      })).toBe(true);
    });
  });

  it('supports optional debug logging through env or local storage', () => {
    expect(isAnalyticsDebugEnabled({}, createMemoryStorage())).toBe(false);
    expect(isAnalyticsDebugEnabled({ VITE_ANALYTICS_DEBUG: 'true' }, createMemoryStorage())).toBe(true);
    expect(isAnalyticsDebugEnabled({}, createMemoryStorage({ 'debug-analytics': 'true' }))).toBe(true);
  });

  it('does not send analytics requests when analytics is not configured', async () => {
    trackEvent('lesson_viewed', { lessonId: 'lesson-01' });

    await expect(flushAnalyticsQueue({ force: true })).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
