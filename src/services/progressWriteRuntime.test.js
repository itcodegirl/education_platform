import { describe, it, expect } from 'vitest';
import { getProgressWriteFailure } from './progressWriteRuntime';

describe('getProgressWriteFailure', () => {
  // ─── falsy / null input ──────────────────────────────────
  it('returns null for null', () => {
    expect(getProgressWriteFailure(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(getProgressWriteFailure(undefined)).toBeNull();
  });

  it('returns null for false', () => {
    expect(getProgressWriteFailure(false)).toBeNull();
  });

  // ─── Error instance passthrough ──────────────────────────
  it('returns the Error directly when passed an Error instance', () => {
    const err = new Error('something failed');
    expect(getProgressWriteFailure(err)).toBe(err);
  });

  // ─── object without error key ────────────────────────────
  it('returns null when the object has no "error" key', () => {
    expect(getProgressWriteFailure({ data: 'ok' })).toBeNull();
    expect(getProgressWriteFailure({})).toBeNull();
  });

  // ─── object with error: null / falsy ─────────────────────
  it('returns null when error field is null', () => {
    expect(getProgressWriteFailure({ error: null })).toBeNull();
  });

  it('returns null when error field is false', () => {
    expect(getProgressWriteFailure({ error: false })).toBeNull();
  });

  // ─── error field is an Error instance ────────────────────
  it('returns the nested Error instance directly', () => {
    const inner = new Error('inner');
    const result = getProgressWriteFailure({ error: inner });
    expect(result).toBe(inner);
  });

  // ─── error field is a plain object with message ──────────
  it('wraps a plain object with a message string into an Error', () => {
    const result = getProgressWriteFailure({ error: { message: 'write failed' } });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('write failed');
  });

  it('trims whitespace from the message field', () => {
    const result = getProgressWriteFailure({ error: { message: '  trimmed  ' } });
    expect(result.message).toBe('trimmed');
  });

  it('falls back to details when message is empty or whitespace', () => {
    const result = getProgressWriteFailure({ error: { message: '', details: 'row not found' } });
    expect(result.message).toBe('row not found');
  });

  it('falls back to details when message is whitespace-only', () => {
    const result = getProgressWriteFailure({ error: { message: '   ', details: 'conflict' } });
    expect(result.message).toBe('conflict');
  });

  it('uses a generic fallback when both message and details are empty', () => {
    const result = getProgressWriteFailure({ error: {} });
    expect(result.message).toBe('Unknown progress write failure');
  });

  // ─── error field with code / status ──────────────────────
  it('attaches a string code to the Error when present', () => {
    const result = getProgressWriteFailure({ error: { message: 'oops', code: 'CONFLICT' } });
    expect(result.code).toBe('CONFLICT');
  });

  it('attaches a numeric code to the Error when present', () => {
    const result = getProgressWriteFailure({ error: { message: 'oops', code: 23505 } });
    expect(result.code).toBe(23505);
  });

  it('attaches a status number to the Error when present', () => {
    const result = getProgressWriteFailure({ error: { message: 'oops', status: 409 } });
    expect(result.status).toBe(409);
  });

  it('does not attach code when the field is absent', () => {
    const result = getProgressWriteFailure({ error: { message: 'oops' } });
    expect('code' in result).toBe(false);
  });
});
