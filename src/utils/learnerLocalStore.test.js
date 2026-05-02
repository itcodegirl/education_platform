import { describe, it, expect } from 'vitest';
import {
  normalizeRewardHistory,
  normalizeStringList,
  readChallengeCompletions,
  readRewardHistory,
  writeChallengeCompletions,
  writeRewardHistory,
} from './learnerLocalStore';

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));
  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
    inspect: () => Object.fromEntries(entries),
  };
}

describe('normalizeStringList', () => {
  it('returns an empty array for non-arrays and arrays of junk', () => {
    expect(normalizeStringList(undefined)).toEqual([]);
    expect(normalizeStringList(null)).toEqual([]);
    expect(normalizeStringList('not-an-array')).toEqual([]);
    expect(normalizeStringList([null, 0, '', '   ', false, {}])).toEqual([]);
  });

  it('trims, dedupes, and preserves first-seen order', () => {
    expect(normalizeStringList(['  a ', 'b', 'a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('exports an alias for reward history', () => {
    expect(normalizeRewardHistory).toBe(normalizeStringList);
  });
});

describe('reward history storage', () => {
  it('returns [] for an unknown user', () => {
    const storage = createMemoryStorage();
    expect(readRewardHistory('user-1', { storage })).toEqual([]);
  });

  it('returns [] when no userId is supplied (defensive)', () => {
    const storage = createMemoryStorage();
    expect(readRewardHistory('', { storage })).toEqual([]);
  });

  it('round-trips a normalized reward history', () => {
    const storage = createMemoryStorage();
    writeRewardHistory('user-1', ['  one ', 'two', 'one', '', null], { storage });
    expect(readRewardHistory('user-1', { storage })).toEqual(['one', 'two']);
  });

  it('returns [] when the persisted value is corrupt JSON', () => {
    const storage = createMemoryStorage({
      'chw-reward-history:user-1': '{not-valid-json',
    });
    expect(readRewardHistory('user-1', { storage })).toEqual([]);
  });

  it('scopes storage keys per user', () => {
    const storage = createMemoryStorage();
    writeRewardHistory('a', ['only-a'], { storage });
    writeRewardHistory('b', ['only-b'], { storage });
    expect(readRewardHistory('a', { storage })).toEqual(['only-a']);
    expect(readRewardHistory('b', { storage })).toEqual(['only-b']);
  });
});

describe('challenge completion storage', () => {
  it('round-trips and normalizes the persisted set', () => {
    const storage = createMemoryStorage();
    writeChallengeCompletions('user-1', [' html-ch-1 ', 'html-ch-1', 'html-ch-2'], { storage });
    expect(readChallengeCompletions('user-1', { storage })).toEqual(['html-ch-1', 'html-ch-2']);
  });

  it('returns [] for unknown users without throwing', () => {
    const storage = createMemoryStorage();
    expect(readChallengeCompletions('nobody', { storage })).toEqual([]);
  });

  it('is a no-op when no userId is supplied', () => {
    const storage = createMemoryStorage();
    writeChallengeCompletions('', ['html-ch-1'], { storage });
    expect(storage.inspect()).toEqual({});
  });
});
