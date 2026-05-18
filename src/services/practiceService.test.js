import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSupabaseGetSession } = vi.hoisted(() => ({
  mockSupabaseGetSession: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: (...args) => mockSupabaseGetSession(...args) },
  },
}));

// fetch is global in jsdom; we replace it per test
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { generatePracticeCard } from './practiceService';

const VALID_SESSION = { access_token: 'tok-abc', user: { id: 'u1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseGetSession.mockResolvedValue({ data: { session: VALID_SESSION } });
});

function makeResponse(ok, body) {
  return {
    ok,
    json: typeof body === 'function'
      ? body
      : () => Promise.resolve(body),
  };
}

describe('generatePracticeCard', () => {
  it('throws when the user has no active session', async () => {
    mockSupabaseGetSession.mockResolvedValue({ data: { session: null } });
    await expect(generatePracticeCard({ topic: 'CSS', concept: 'flexbox' }))
      .rejects.toThrow('signed in');
  });

  it('throws when session has no access_token', async () => {
    mockSupabaseGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    await expect(generatePracticeCard({ topic: 'CSS', concept: 'flexbox' }))
      .rejects.toThrow('signed in');
  });

  it('returns the card on a successful response', async () => {
    const card = { question: 'What is flexbox?', options: ['a', 'b'], correct: 'a' };
    mockFetch.mockResolvedValue(makeResponse(true, { card }));
    const result = await generatePracticeCard({ topic: 'CSS', concept: 'flexbox' });
    expect(result).toEqual(card);
  });

  it('sends the correct headers and body', async () => {
    const card = { question: 'Q?', options: [], correct: 'a' };
    mockFetch.mockResolvedValue(makeResponse(true, { card }));
    await generatePracticeCard({ topic: 'JS', concept: 'closures' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/practice-generate');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.headers.Authorization).toBe('Bearer tok-abc');
    expect(JSON.parse(opts.body)).toEqual({ topic: 'JS', concept: 'closures' });
  });

  it('throws with the server error message on a non-ok response', async () => {
    mockFetch.mockResolvedValue(makeResponse(false, { error: 'Rate limit exceeded' }));
    await expect(generatePracticeCard({ topic: 'CSS', concept: 'flexbox' }))
      .rejects.toThrow('Rate limit exceeded');
  });

  it('throws the fallback message when non-ok and JSON parse fails', async () => {
    mockFetch.mockResolvedValue(makeResponse(false, () => Promise.reject(new Error('bad json'))));
    await expect(generatePracticeCard({ topic: 'CSS', concept: 'flexbox' }))
      .rejects.toThrow('Failed to generate practice card');
  });

  it('throws when response is ok but card field is missing', async () => {
    mockFetch.mockResolvedValue(makeResponse(true, { result: 'something' }));
    await expect(generatePracticeCard({ topic: 'CSS', concept: 'flexbox' }))
      .rejects.toThrow('Server returned no card');
  });

  it('throws when response is ok but JSON parse fails', async () => {
    mockFetch.mockResolvedValue(makeResponse(true, () => Promise.reject(new Error('bad json'))));
    await expect(generatePracticeCard({ topic: 'CSS', concept: 'flexbox' }))
      .rejects.toThrow('Server returned no card');
  });
});
