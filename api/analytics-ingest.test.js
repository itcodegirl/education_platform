import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toSafeText,
  toSafeTimestamp,
  toSafePayload,
  toInsertRow,
  handleRequest,
} from './analytics-ingest.js';

// ─── handleRequest mocks ──────────────────────────────────────────────────────

const { mockVerifyActiveUser, mockGetSupabaseConfig } = vi.hoisted(() => ({
  mockVerifyActiveUser: vi.fn(),
  mockGetSupabaseConfig: vi.fn(),
}));

vi.mock('./_shared.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyActiveUser: mockVerifyActiveUser,
    getSupabaseConfig: mockGetSupabaseConfig,
  };
});

// ─── toSafeText ───────────────────────────────────────────────────────────────

describe('toSafeText()', () => {
  it('returns the string trimmed and within maxChars', () => {
    expect(toSafeText('hello', 10)).toBe('hello');
    expect(toSafeText('hello world', 5)).toBe('hello');
  });

  it('returns the fallback for non-string values', () => {
    expect(toSafeText(null, 10, 'default')).toBe('default');
    expect(toSafeText(42, 10, 'default')).toBe('default');
    expect(toSafeText(undefined, 10, 'default')).toBe('default');
  });

  it('returns the fallback for an empty or whitespace-only string', () => {
    expect(toSafeText('', 10, 'fallback')).toBe('fallback');
    expect(toSafeText('   ', 10, 'fallback')).toBe('fallback');
  });

  it('defaults to empty string fallback when none provided', () => {
    expect(toSafeText(null, 10)).toBe('');
  });
});

// ─── toSafeTimestamp ──────────────────────────────────────────────────────────

const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

describe('toSafeTimestamp()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a valid recent timestamp and returns an ISO string', () => {
    const recent = new Date('2026-05-17T11:00:00Z').toISOString();
    const result = toSafeTimestamp(recent);
    expect(result).toBe('2026-05-17T11:00:00.000Z');
  });

  it('returns the current time fallback for a timestamp older than 7 days', () => {
    const old = new Date(Date.now() - MAX_EVENT_AGE_MS - 1000).toISOString();
    const result = toSafeTimestamp(old);
    expect(result).toBe(new Date().toISOString());
  });

  it('returns the current time fallback for a timestamp more than 5 min in the future', () => {
    const future = new Date(Date.now() + MAX_FUTURE_SKEW_MS + 1000).toISOString();
    const result = toSafeTimestamp(future);
    expect(result).toBe(new Date().toISOString());
  });

  it('accepts a timestamp exactly at the future skew boundary', () => {
    const boundary = new Date(Date.now() + MAX_FUTURE_SKEW_MS).toISOString();
    const result = toSafeTimestamp(boundary);
    expect(result).toBe(boundary);
  });

  it('returns the current time fallback for an unparseable string', () => {
    const result = toSafeTimestamp('not-a-date');
    expect(result).toBe(new Date().toISOString());
  });

  it('returns the current time fallback for a non-string value', () => {
    const result = toSafeTimestamp(null);
    expect(result).toBe(new Date().toISOString());
  });
});

// ─── toSafePayload ────────────────────────────────────────────────────────────

describe('toSafePayload()', () => {
  it('returns a plain object as-is', () => {
    expect(toSafePayload({ key: 'value' })).toEqual({ key: 'value' });
  });

  it('returns {} for null, undefined, or non-object values', () => {
    expect(toSafePayload(null)).toEqual({});
    expect(toSafePayload(undefined)).toEqual({});
    expect(toSafePayload('string')).toEqual({});
    expect(toSafePayload(42)).toEqual({});
  });

  it('returns {} for arrays (to prevent array injection)', () => {
    expect(toSafePayload([1, 2, 3])).toEqual({});
  });
});

// ─── toInsertRow ──────────────────────────────────────────────────────────────

describe('toInsertRow()', () => {
  it('returns null for null or non-object input', () => {
    expect(toInsertRow(null, 'uid')).toBeNull();
    expect(toInsertRow('string', 'uid')).toBeNull();
  });

  it('returns null when the event name is empty', () => {
    expect(toInsertRow({ name: '', path: '/home', ts: new Date().toISOString() }, 'uid')).toBeNull();
    expect(toInsertRow({ path: '/home', ts: new Date().toISOString() }, 'uid')).toBeNull();
  });

  it('builds a correctly shaped insert row for a valid event', () => {
    const ts = new Date().toISOString();
    const row = toInsertRow({ name: 'lesson_view', path: '/learn', ts }, 'user-123');
    expect(row).toMatchObject({
      user_id: 'user-123',
      event_name: 'lesson_view',
      path: '/learn',
      source: 'web',
    });
    expect(typeof row.occurred_at).toBe('string');
    expect(typeof row.payload).toBe('object');
  });

  it('truncates event names longer than 80 characters', () => {
    const longName = 'a'.repeat(100);
    const row = toInsertRow({ name: longName, path: '/' }, 'uid');
    expect(row.event_name.length).toBe(80);
  });

  it('defaults path to "/" when path is missing', () => {
    const row = toInsertRow({ name: 'click' }, 'uid');
    expect(row.path).toBe('/');
  });

  it('sanitises an array payload to an empty object', () => {
    const row = toInsertRow({ name: 'test', payload: [1, 2, 3] }, 'uid');
    expect(row.payload).toEqual({});
  });

  it('passes a valid payload object through', () => {
    const row = toInsertRow({ name: 'test', payload: { lessonId: 'abc' } }, 'uid');
    expect(row.payload).toEqual({ lessonId: 'abc' });
  });
});

// ─── handleRequest ────────────────────────────────────────────────────────────

const VALID_EVENT = { name: 'lesson_view', path: '/learn', ts: new Date().toISOString() };

function makeEvent(overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: { authorization: 'Bearer tok' },
    body: JSON.stringify({ events: [VALID_EVENT] }),
    queryStringParameters: {},
    ...overrides,
  };
}

describe('handleRequest()', () => {
  beforeEach(() => {
    mockVerifyActiveUser.mockResolvedValue({ id: 'user-123' });
    mockGetSupabaseConfig.mockReturnValue({ url: 'https://db.test', key: 'svc-key' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 202 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const res = await handleRequest(makeEvent({ httpMethod: 'GET' }));
    expect(res.statusCode).toBe(405);
  });

  it('returns 401 when no Authorization header is present', async () => {
    const res = await handleRequest(makeEvent({ headers: {} }));
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/authentication required/i);
  });

  it('returns 401 when verifyActiveUser returns null (invalid token)', async () => {
    mockVerifyActiveUser.mockResolvedValue(null);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/invalid or expired/i);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await handleRequest(makeEvent({ body: '{bad json' }));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when events array is empty', async () => {
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ events: [] }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/no events/i);
  });

  it('returns 413 when batch exceeds 50 events', async () => {
    const events = Array.from({ length: 51 }, () => VALID_EVENT);
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ events }) }));
    expect(res.statusCode).toBe(413);
  });

  it('returns 400 when all events are invalid (no valid rows)', async () => {
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ events: [{ name: '' }] }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/no valid analytics events/i);
  });

  it('returns 500 when Supabase is not configured', async () => {
    mockGetSupabaseConfig.mockReturnValue({ url: '', key: '' });
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(500);
  });

  it('returns 502 when Supabase returns a 5xx error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    }));
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(502);
  });

  it('returns 502 when the Supabase fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(502);
  });

  it('returns 202 with accepted count on success', async () => {
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(202);
    expect(JSON.parse(res.body).accepted).toBe(1);
  });

  it('sends the correct auth token to Supabase', async () => {
    await handleRequest(makeEvent());
    const [, init] = fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok');
  });
});
