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
    update: vi.fn(() => chain),
    maybeSingle: vi.fn(() => result),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  };
  return chain;
}

const UID = '00000000-0000-0000-0000-000000000001';

beforeEach(() => {
  mockFrom.mockReset();
  // Default: every table returns empty data, no error
  mockFrom.mockImplementation(() => makeChain([], null));
});

// ─── fetchAllUserData ────────────────────────────

describe('fetchAllUserData', () => {
  it('returns structured data plus empty error buckets on success', async () => {
    const result = await fetchAllUserData(UID);

    expect(result).toMatchObject({
      data: {
        progress: expect.any(Array),
        quiz: expect.any(Array),
        xp: null,
        streak: null,
        daily: null,
        badges: expect.any(Array),
        sr: expect.any(Array),
        bookmarks: expect.any(Array),
        notes: expect.any(Array),
        visited: expect.any(Array),
        position: null,
      },
      recoverableErrors: {},
      criticalError: null,
    });
  });

  it('marks lesson progress failures as critical', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'progress') return makeChain(null, { message: 'connection refused' });
      return makeChain([], null);
    });

    const result = await fetchAllUserData(UID);

    expect(result.criticalError).toMatchObject({
      message: 'Lesson progress failed to load. (progress: connection refused)',
      details: 'progress: connection refused',
    });
    expect(result.data.progress).toEqual([]);
  });

  it('collects optional domain failures as recoverable warnings', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'xp' || table === 'badges') {
        return makeChain(null, { message: `${table} timeout` });
      }
      return makeChain([], null);
    });

    const result = await fetchAllUserData(UID);

    expect(result.criticalError).toBeNull();
    expect(result.recoverableErrors.xp).toMatchObject({
      message: 'XP summary failed to load.',
      detail: 'xp timeout',
    });
    expect(result.recoverableErrors.badges).toMatchObject({
      message: 'Badges failed to load.',
      detail: 'badges timeout',
    });
    expect(result.data.xp).toBeNull();
    expect(result.data.badges).toEqual([]);
  });

  it('keeps the source detail for recoverable table failures', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'quiz_scores') return makeChain(null, { message: 'bad request' });
      return makeChain([], null);
    });

    const result = await fetchAllUserData(UID);

    expect(result.recoverableErrors.quiz).toMatchObject({
      domain: 'quiz',
      message: 'Quiz history failed to load.',
      detail: 'bad request',
    });
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
    await saveQuizScore(UID, 'html|mod1', '8/10');
    expect(mockFrom).toHaveBeenCalledWith('quiz_scores');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: UID,
        quiz_key: 'html|mod1',
        score: '8/10',
        completed_at: expect.any(String),
      }),
      {
        onConflict: 'user_id,quiz_key',
        ignoreDuplicates: false,
      },
    );
  });

  it('handles duplicate identical quiz score saves without surfacing a conflict', async () => {
    const upsertChain = makeChain(null, {
      status: 409,
      message: 'duplicate key value violates unique constraint',
    });
    const selectChain = makeChain({ score: '8/10' });
    const logger = { info: vi.fn() };
    const storage = {
      getItem: vi.fn((key) => (key === 'debug-quiz-score-save' ? 'true' : null)),
    };
    mockFrom
      .mockReturnValueOnce(upsertChain)
      .mockReturnValueOnce(selectChain);

    const result = await saveQuizScore(UID, 'html|mod1', '8/10', { logger, storage });

    expect(result).toMatchObject({
      error: null,
      conflictHandled: true,
      skipped: true,
    });
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: UID,
        quiz_key: 'html|mod1',
        score: '8/10',
      }),
      {
        onConflict: 'user_id,quiz_key',
        ignoreDuplicates: false,
      },
    );
    expect(selectChain.select).toHaveBeenCalledWith('score');
    expect(selectChain.eq).toHaveBeenCalledWith('user_id', UID);
    expect(selectChain.eq).toHaveBeenCalledWith('quiz_key', 'html|mod1');
    expect(selectChain.update).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      '[CodeHerWay] quiz score save',
      expect.objectContaining({
        attempted: true,
        upsertUsed: true,
        conflictHandled: true,
        finalResult: 'skipped_existing_best',
      }),
    );
  });

  it('updates an improved quiz score after a production upsert conflict', async () => {
    const upsertChain = makeChain(null, {
      status: 409,
      message: 'duplicate key value violates unique constraint',
    });
    const selectChain = makeChain({ score: '1/2' });
    const updateChain = makeChain(null);
    mockFrom
      .mockReturnValueOnce(upsertChain)
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    const result = await saveQuizScore(UID, 'html|mod1', '2/2');

    expect(result).toMatchObject({
      error: null,
      conflictHandled: true,
      skipped: false,
    });
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: UID,
        quiz_key: 'html|mod1',
        score: '2/2',
      }),
      {
        onConflict: 'user_id,quiz_key',
        ignoreDuplicates: false,
      },
    );
    expect(updateChain.update).toHaveBeenCalledWith({
      score: '2/2',
      completed_at: expect.any(String),
    });
    expect(updateChain.eq).toHaveBeenCalledWith('user_id', UID);
    expect(updateChain.eq).toHaveBeenCalledWith('quiz_key', 'html|mod1');
  });

  it('does not overwrite a higher quiz score after a production upsert conflict', async () => {
    const upsertChain = makeChain(null, {
      status: 409,
      message: 'duplicate key value violates unique constraint',
    });
    const selectChain = makeChain({ score: '2/2' });
    mockFrom
      .mockReturnValueOnce(upsertChain)
      .mockReturnValueOnce(selectChain);

    const result = await saveQuizScore(UID, 'html|mod1', '1/2');

    expect(result).toMatchObject({
      error: null,
      conflictHandled: true,
      skipped: true,
    });
    expect(selectChain.update).not.toHaveBeenCalled();
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
