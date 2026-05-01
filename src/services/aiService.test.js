import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AIServiceError,
  AI_ERROR_CODES,
  askLessonTutor,
  askChallengeTutor,
  explainCode,
} from './aiService';
import { supabase } from '../lib/supabaseClient';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

const validSession = {
  data: { session: { access_token: 'test-token-123' } },
  error: null,
};

beforeEach(() => {
  supabase.auth.getSession.mockResolvedValue(validSession);
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AIServiceError', () => {
  it('exposes a stable code, status, and userMessage', () => {
    const err = new AIServiceError({
      code: AI_ERROR_CODES.PAYLOAD_TOO_LARGE,
      status: 413,
    });
    expect(err.code).toBe('PAYLOAD_TOO_LARGE');
    expect(err.status).toBe(413);
    expect(err.userMessage).toMatch(/too long/i);
    expect(err.message).toBe(err.userMessage);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AIServiceError');
  });

  it('falls back to a default user message when none is given', () => {
    const err = new AIServiceError({ code: AI_ERROR_CODES.NETWORK });
    expect(err.userMessage).toMatch(/offline/i);
  });

  it('preserves the original cause when one is provided', () => {
    const cause = new TypeError('fetch failed');
    const err = new AIServiceError({ code: AI_ERROR_CODES.NETWORK, cause });
    expect(err.cause).toBe(cause);
  });
});

describe('callAI error classification', () => {
  it('throws UNAUTHENTICATED when no session is present', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    await expect(askLessonTutor({ system: 's', history: [], question: 'q' })).rejects.toMatchObject({
      name: 'AIServiceError',
      code: AI_ERROR_CODES.UNAUTHENTICATED,
    });
  });

  it('throws NETWORK when fetch itself rejects', async () => {
    globalThis.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(askChallengeTutor({ system: 's', question: 'q' })).rejects.toMatchObject({
      code: AI_ERROR_CODES.NETWORK,
    });
  });

  it('throws PAYLOAD_TOO_LARGE on a 413 response', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 413,
      json: async () => ({}),
    });

    await expect(explainCode({ system: 's', code: 'c' })).rejects.toMatchObject({
      code: AI_ERROR_CODES.PAYLOAD_TOO_LARGE,
      status: 413,
    });
  });

  it('throws RATE_LIMITED on a 429 response', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    await expect(askLessonTutor({ system: 's', history: [], question: 'q' })).rejects.toMatchObject({
      code: AI_ERROR_CODES.RATE_LIMITED,
      status: 429,
    });
  });

  it('throws SERVER_UNAVAILABLE on any 5xx response', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(askLessonTutor({ system: 's', history: [], question: 'q' })).rejects.toMatchObject({
      code: AI_ERROR_CODES.SERVER_UNAVAILABLE,
      status: 503,
    });
  });

  it('returns the response text on a successful 200', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ text: 'Here is your answer.' }),
    });

    const result = await askLessonTutor({ system: 's', history: [], question: 'q' });
    expect(result).toBe('Here is your answer.');
  });
});
