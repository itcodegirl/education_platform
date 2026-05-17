import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toSafeText,
  toSafeTimestamp,
  toSafePayload,
  toInsertRow,
} from './analytics-ingest.js';

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
