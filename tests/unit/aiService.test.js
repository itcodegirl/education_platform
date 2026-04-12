// ═══════════════════════════════════════════════
// AI SERVICE TESTS — Covers the auth guard, JSON
// parse failures, and error propagation so the
// silent-catch regression can't come back.
// ═══════════════════════════════════════════════

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Shared mock session controlled per test
const mockSession = { access_token: 'test-token' };

vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: mockSession } })),
    },
  },
}));

// Import after the mock so aiService picks it up.
const { askLessonTutor } = await import('../../src/services/aiService.js');
const { supabase } = await import('../../src/lib/supabaseClient');

function mockFetch(impl) {
  global.fetch = vi.fn(impl);
}

describe('aiService.callAI', () => {
  beforeEach(() => {
    mockSession.access_token = 'test-token';
    supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
  });

  test('throws when the user is not signed in', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    await expect(askLessonTutor({ system: '', history: [], question: 'hi' }))
      .rejects.toThrow(/signed in/i);
  });

  test('returns the text field on a healthy response', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ text: 'hello from the tutor' }),
    }));
    const out = await askLessonTutor({ system: 'sys', history: [], question: 'q' });
    expect(out).toBe('hello from the tutor');
  });

  test('throws with the upstream error message on non-2xx', async () => {
    mockFetch(async () => ({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
    }));
    await expect(askLessonTutor({ system: '', history: [], question: 'q' }))
      .rejects.toThrow(/too many requests/i);
  });

  test('surfaces HTTP status when the error body is not valid JSON', async () => {
    mockFetch(async () => ({
      ok: false,
      status: 502,
      text: async () => '<!doctype html><title>Bad Gateway</title>',
    }));
    // Regression: previously the silent .catch(() => ({})) would lose this
    // entirely and throw a generic "AI request failed".
    await expect(askLessonTutor({ system: '', history: [], question: 'q' }))
      .rejects.toThrow(/HTTP 502/);
  });

  test('throws a readable error when a 200 response has malformed JSON', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () => 'not json at all',
    }));
    await expect(askLessonTutor({ system: '', history: [], question: 'q' }))
      .rejects.toThrow(/unreadable/i);
  });

  test('wraps network failures in a friendly message', async () => {
    mockFetch(async () => { throw new TypeError('Failed to fetch'); });
    await expect(askLessonTutor({ system: '', history: [], question: 'q' }))
      .rejects.toThrow(/connection/i);
  });
});
