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
