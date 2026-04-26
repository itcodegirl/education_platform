// ═══════════════════════════════════════════════
// Unit tests for progressService.js
//
// progressService wraps Supabase operations. We stub
// the Supabase client so no real network calls are
// made, then assert on call arguments and the error-
// aggregation logic inside fetchAllUserData.
// ═══════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase mock ───────────────────────────────
// vi.hoisted runs before vi.mock, letting us share
// a mutable reference with the factory below.
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: mockFrom },
}));

import {
  fetchAllUserData,
  addLesson,
  removeLesson,
  saveQuizScore,
  updateXP,
  awardBadge,
} from './progressService';

// ─── Chain builder ───────────────────────────────
// Creates a builder-pattern mock that:
//   • is awaitable directly (for .eq() terminal calls)
//   • exposes .maybeSingle() for single-row queries
//   • exposes .delete() / .upsert() for write paths
function makeChain(data, error = null) {
  const result = Promise.resolve({ data, error });
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => result),
    maybeSingle: vi.fn(() => result),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  };
  return chain;
}

const UID = '00000000-0000-0000-0000-000000000001';

beforeEach(() => {
  // Default: every table returns empty data, no error
  mockFrom.mockImplementation(() => makeChain([], null));
});

// ─── fetchAllUserData ────────────────────────────

describe('fetchAllUserData', () => {
  it('returns an object with all 11 expected keys on success', async () => {
    const result = await fetchAllUserData(UID);

    expect(result).toMatchObject({
      progress: expect.any(Object),
      quiz: expect.any(Object),
      xp: expect.any(Object),
      streak: expect.any(Object),
      daily: expect.any(Object),
      badges: expect.any(Object),
      sr: expect.any(Object),
      bookmarks: expect.any(Object),
      notes: expect.any(Object),
      visited: expect.any(Object),
      position: expect.any(Object),
    });
  });

  it('throws a combined error when one table fails', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'progress') return makeChain(null, { message: 'connection refused' });
      return makeChain([], null);
    });

    await expect(fetchAllUserData(UID)).rejects.toThrow('progress: connection refused');
  });

  it('lists every failed table in the error message', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'xp' || table === 'badges') {
        return makeChain(null, { message: `${table} timeout` });
      }
      return makeChain([], null);
    });

    await expect(fetchAllUserData(UID)).rejects.toThrow(/xp.*badges|badges.*xp/);
  });

  it('includes the source table name in the error details', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'quiz_scores') return makeChain(null, { message: 'bad request' });
      return makeChain([], null);
    });

    await expect(fetchAllUserData(UID)).rejects.toThrow('quiz_scores: bad request');
  });
});

// ─── Write functions ─────────────────────────────

describe('addLesson', () => {
  it('calls supabase.from("progress")', async () => {
    await addLesson(UID, 'html|basics|intro');
    expect(mockFrom).toHaveBeenCalledWith('progress');
  });
});

describe('removeLesson', () => {
  it('calls supabase.from("progress")', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValue(chain);
    await removeLesson(UID, 'html|basics|intro');
    expect(mockFrom).toHaveBeenCalledWith('progress');
    expect(chain.delete).toHaveBeenCalled();
  });
});

describe('saveQuizScore', () => {
  it('upserts the first quiz score using the user_id + quiz_key conflict target', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValue(chain);
    await saveQuizScore(UID, 'html|mod1', '80');
    expect(mockFrom).toHaveBeenCalledWith('quiz_scores');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: UID,
        quiz_key: 'html|mod1',
        score: '80',
        completed_at: expect.any(String),
      }),
      {
        onConflict: 'user_id,quiz_key',
      },
    );
  });

  it('uses the same conflict-safe upsert for repeated quiz score saves', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValue(chain);

    await saveQuizScore(UID, 'html|mod1', '80');
    await saveQuizScore(UID, 'html|mod1', '80');

    expect(chain.upsert).toHaveBeenCalledTimes(2);
    expect(chain.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: UID,
        quiz_key: 'html|mod1',
        score: '80',
      }),
      {
        onConflict: 'user_id,quiz_key',
      },
    );
  });

  it('updates an improved quiz score through the same conflict target', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValue(chain);

    await saveQuizScore(UID, 'html|mod1', '90');

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: UID,
        quiz_key: 'html|mod1',
        score: '90',
      }),
      {
        onConflict: 'user_id,quiz_key',
      },
    );
  });
});

describe('updateXP', () => {
  it('upserts to xp with updated_at timestamp', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValue(chain);
    await updateXP(UID, 500);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: UID, total: 500, updated_at: expect.any(String) }),
    );
  });
});

describe('awardBadge', () => {
  it('upserts to badges with earned_at timestamp', async () => {
    const chain = makeChain(null);
    mockFrom.mockReturnValue(chain);
    await awardBadge(UID, 'streak_7');
    expect(mockFrom).toHaveBeenCalledWith('badges');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: UID, badge_id: 'streak_7', earned_at: expect.any(String) }),
    );
  });
});
