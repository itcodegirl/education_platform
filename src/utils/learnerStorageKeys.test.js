import { describe, it, expect } from 'vitest';
import {
  GUEST_LEARNER_STORAGE_ID,
  getLearnerStorageId,
  getLearnerStorageKey,
  getLegacyStorageKey,
} from './learnerStorageKeys';

// ─── GUEST_LEARNER_STORAGE_ID ────────────────────────────────
describe('GUEST_LEARNER_STORAGE_ID', () => {
  it('is the string "guest"', () => {
    expect(GUEST_LEARNER_STORAGE_ID).toBe('guest');
  });
});

// ─── getLearnerStorageId ─────────────────────────────────────
describe('getLearnerStorageId', () => {
  it('returns the trimmed userId for a valid string', () => {
    expect(getLearnerStorageId('user-abc')).toBe('user-abc');
  });

  it('trims leading and trailing whitespace', () => {
    expect(getLearnerStorageId('  user-abc  ')).toBe('user-abc');
  });

  it('returns "guest" for an empty string', () => {
    expect(getLearnerStorageId('')).toBe(GUEST_LEARNER_STORAGE_ID);
  });

  it('returns "guest" for a whitespace-only string', () => {
    expect(getLearnerStorageId('   ')).toBe(GUEST_LEARNER_STORAGE_ID);
  });

  it('returns "guest" for non-string inputs', () => {
    expect(getLearnerStorageId(null)).toBe(GUEST_LEARNER_STORAGE_ID);
    expect(getLearnerStorageId(undefined)).toBe(GUEST_LEARNER_STORAGE_ID);
    expect(getLearnerStorageId(42)).toBe(GUEST_LEARNER_STORAGE_ID);
    expect(getLearnerStorageId({})).toBe(GUEST_LEARNER_STORAGE_ID);
    expect(getLearnerStorageId([])).toBe(GUEST_LEARNER_STORAGE_ID);
  });

  it('preserves IDs that contain special characters (e.g. Supabase UUIDs)', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(getLearnerStorageId(uuid)).toBe(uuid);
  });
});

// ─── getLearnerStorageKey ────────────────────────────────────
describe('getLearnerStorageKey', () => {
  it('combines baseKey and userId with a colon separator', () => {
    expect(getLearnerStorageKey('progress', 'user-1')).toBe('progress:user-1');
  });

  it('uses the guest fallback when userId is invalid', () => {
    expect(getLearnerStorageKey('progress', null)).toBe('progress:guest');
    expect(getLearnerStorageKey('progress', '')).toBe('progress:guest');
    expect(getLearnerStorageKey('progress', undefined)).toBe('progress:guest');
  });

  it('trims userId whitespace in the composite key', () => {
    expect(getLearnerStorageKey('xp', '  uid-99  ')).toBe('xp:uid-99');
  });
});

// ─── getLegacyStorageKey ─────────────────────────────────────
describe('getLegacyStorageKey', () => {
  it('returns the baseKey unchanged', () => {
    expect(getLegacyStorageKey('completedLessons')).toBe('completedLessons');
    expect(getLegacyStorageKey('xp-data')).toBe('xp-data');
  });
});
