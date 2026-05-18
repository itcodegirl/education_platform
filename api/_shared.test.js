import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { json, createRateLimiter } from './_shared.js';

describe('json()', () => {
  it('returns the correct statusCode and Content-Type header', () => {
    const result = json(200, { ok: true });
    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('serialises the body to JSON', () => {
    const result = json(400, { error: 'bad request' });
    expect(JSON.parse(result.body)).toEqual({ error: 'bad request' });
  });

  it('preserves numeric statusCode exactly', () => {
    expect(json(201, {}).statusCode).toBe(201);
    expect(json(404, {}).statusCode).toBe(404);
    expect(json(502, {}).statusCode).toBe(502);
  });
});

describe('createRateLimiter()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the limit', () => {
    const check = createRateLimiter(60_000, 3);
    expect(check('u1')).toBe(true);
    expect(check('u1')).toBe(true);
    expect(check('u1')).toBe(true);
  });

  it('blocks the next request once the limit is reached', () => {
    const check = createRateLimiter(60_000, 3);
    check('u1');
    check('u1');
    check('u1');
    expect(check('u1')).toBe(false);
  });

  it('resets after the window expires', () => {
    const check = createRateLimiter(60_000, 2);
    check('u1');
    check('u1');
    expect(check('u1')).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(check('u1')).toBe(true);
  });

  it('tracks separate windows per user', () => {
    const check = createRateLimiter(60_000, 1);
    expect(check('alice')).toBe(true);
    expect(check('alice')).toBe(false);
    expect(check('bob')).toBe(true);
    expect(check('bob')).toBe(false);
  });

  it('evicts stale entries when the map grows past 200 unique users', () => {
    const check = createRateLimiter(60_000, 1);

    for (let i = 0; i < 200; i++) {
      check(`user-${i}`);
    }

    vi.advanceTimersByTime(60_001);

    // Pushing past 200 triggers cleanup — stale entries removed
    check('user-trigger-eviction');

    // After eviction, a previously rate-limited user's window has
    // expired, so they are allowed again
    expect(check('user-0')).toBe(true);
  });
});

import { getSupabaseConfig, sendResponse } from './_shared.js';

describe('getSupabaseConfig()', () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    Object.keys(process.env).forEach((k) => { if (!(k in origEnv)) delete process.env[k]; });
    Object.assign(process.env, origEnv);
  });

  it('returns url and key from SUPABASE_* vars', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    const { url, key } = getSupabaseConfig();
    expect(url).toBe('https://test.supabase.co');
    expect(key).toBe('anon-key');
  });

  it('falls back to VITE_SUPABASE_URL when SUPABASE_URL is absent', () => {
    delete process.env.SUPABASE_URL;
    process.env.VITE_SUPABASE_URL = 'https://vite.supabase.co';
    const { url } = getSupabaseConfig();
    expect(url).toBe('https://vite.supabase.co');
  });

  it('falls back to VITE_SUPABASE_ANON_KEY when SUPABASE_ANON_KEY is absent', () => {
    delete process.env.SUPABASE_ANON_KEY;
    process.env.VITE_SUPABASE_ANON_KEY = 'vite-anon-key';
    const { key } = getSupabaseConfig();
    expect(key).toBe('vite-anon-key');
  });

  it('returns undefined url and key when env vars are not set', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    const { url, key } = getSupabaseConfig();
    expect(url).toBeUndefined();
    expect(key).toBeUndefined();
  });
});

describe('sendResponse()', () => {
  it('sets headers and sends the body', () => {
    const res = { setHeader: vi.fn(), status: vi.fn(), send: vi.fn() };
    res.status.mockReturnValue(res);
    const response = { statusCode: 200, headers: { 'X-Foo': 'bar' }, body: '{"ok":true}' };
    sendResponse(res, response);
    expect(res.setHeader).toHaveBeenCalledWith('X-Foo', 'bar');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('{"ok":true}');
  });

  it('handles an empty headers object', () => {
    const res = { setHeader: vi.fn(), status: vi.fn(), send: vi.fn() };
    res.status.mockReturnValue(res);
    sendResponse(res, { statusCode: 204, headers: {}, body: '' });
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
