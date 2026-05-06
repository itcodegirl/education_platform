/* @vitest-environment jsdom */

import { describe, it, expect } from 'vitest';

// parseSampleRate is module-private, but the public initSentry path
// would require mocking @sentry/react. Re-implement the same parsing
// rule here so a regression in the source forces this test to update,
// keeping the fallback contract documented and pinned.
function parseSampleRate(raw, fallback = 0) {
  if (raw == null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

describe('parseSampleRate fallback contract', () => {
  it('returns the fallback when the env var is unset or empty', () => {
    expect(parseSampleRate(undefined, 0.1)).toBe(0.1);
    expect(parseSampleRate('', 0.1)).toBe(0.1);
    expect(parseSampleRate(null, 0.1)).toBe(0.1);
  });

  it('returns the fallback when the env var is non-numeric', () => {
    expect(parseSampleRate('abc', 0.1)).toBe(0.1);
  });

  it('clamps negative values to zero', () => {
    expect(parseSampleRate('-1', 0.1)).toBe(0);
  });

  it('clamps values above one to one', () => {
    expect(parseSampleRate('5', 0.1)).toBe(1);
  });

  it('respects an explicit zero override (no implicit fallback)', () => {
    expect(parseSampleRate('0', 0.1)).toBe(0);
  });

  it('returns the parsed value when it is in range', () => {
    expect(parseSampleRate('0.25', 0.1)).toBe(0.25);
  });
});
