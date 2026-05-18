import { describe, it, expect } from 'vitest';
import { validateCard, extractJson } from './practice-generate.js';

// ─── validateCard ─────────────────────────────────────────────────────────────

const VALID_CARD = {
  question: 'What does `display: flex` do?',
  options: ['Creates a flex container', 'Hides the element', 'Adds a border', 'Centers text'],
  correct: 0,
  explanation: 'Setting display to flex makes the element a flex container.',
  code: null,
};

describe('validateCard()', () => {
  it('returns a clean card for fully valid input', () => {
    const result = validateCard(VALID_CARD);
    expect(result).not.toBeNull();
    expect(result.question).toBe(VALID_CARD.question);
    expect(result.correct).toBe(0);
    expect(result.options).toHaveLength(4);
    expect(result.code).toBeNull();
  });

  it('returns null for null or non-object input', () => {
    expect(validateCard(null)).toBeNull();
    expect(validateCard('string')).toBeNull();
    expect(validateCard(42)).toBeNull();
  });

  it('returns null when question is "refused" (AI refusal sentinel)', () => {
    expect(validateCard({ ...VALID_CARD, question: 'refused' })).toBeNull();
  });

  it('returns null when question is empty', () => {
    expect(validateCard({ ...VALID_CARD, question: '' })).toBeNull();
    expect(validateCard({ ...VALID_CARD, question: '   ' })).toBeNull();
  });

  it('returns null when question exceeds 240 characters', () => {
    expect(validateCard({ ...VALID_CARD, question: 'q'.repeat(241) })).toBeNull();
  });

  it('returns null when options is not an array of exactly 4', () => {
    expect(validateCard({ ...VALID_CARD, options: ['a', 'b', 'c'] })).toBeNull();
    expect(validateCard({ ...VALID_CARD, options: ['a', 'b', 'c', 'd', 'e'] })).toBeNull();
    expect(validateCard({ ...VALID_CARD, options: null })).toBeNull();
  });

  it('returns null when any option is empty or exceeds 160 characters', () => {
    expect(validateCard({ ...VALID_CARD, options: ['', 'b', 'c', 'd'] })).toBeNull();
    expect(validateCard({
      ...VALID_CARD,
      options: ['a'.repeat(161), 'b', 'c', 'd'],
    })).toBeNull();
  });

  it('returns null when correct index is out of 0–3 range', () => {
    expect(validateCard({ ...VALID_CARD, correct: -1 })).toBeNull();
    expect(validateCard({ ...VALID_CARD, correct: 4 })).toBeNull();
    expect(validateCard({ ...VALID_CARD, correct: 1.5 })).toBeNull();
  });

  it('returns null when explanation is missing or empty', () => {
    expect(validateCard({ ...VALID_CARD, explanation: '' })).toBeNull();
    expect(validateCard({ ...VALID_CARD, explanation: undefined })).toBeNull();
  });

  it('returns null when explanation exceeds 300 characters', () => {
    expect(validateCard({ ...VALID_CARD, explanation: 'e'.repeat(301) })).toBeNull();
  });

  it('trims leading/trailing whitespace from question and explanation', () => {
    const result = validateCard({
      ...VALID_CARD,
      question: '  What is flex?  ',
      explanation: '  It creates a flex container.  ',
    });
    expect(result.question).toBe('What is flex?');
    expect(result.explanation).toBe('It creates a flex container.');
  });

  it('accepts a valid code snippet and passes it through', () => {
    const result = validateCard({ ...VALID_CARD, code: '.box { display: flex; }' });
    expect(result.code).toBe('.box { display: flex; }');
  });

  it('drops code that is empty or exceeds 400 characters', () => {
    expect(validateCard({ ...VALID_CARD, code: '' }).code).toBeNull();
    expect(validateCard({ ...VALID_CARD, code: 'x'.repeat(401) }).code).toBeNull();
  });
});

// ─── extractJson ──────────────────────────────────────────────────────────────

describe('extractJson()', () => {
  it('parses a plain JSON string', () => {
    expect(extractJson('{"key":"value"}')).toEqual({ key: 'value' });
  });

  it('extracts JSON from a ```json ... ``` fence', () => {
    const fenced = '```json\n{"key":"value"}\n```';
    expect(extractJson(fenced)).toEqual({ key: 'value' });
  });

  it('extracts JSON from a plain ``` ... ``` fence (no language tag)', () => {
    const fenced = '```\n{"key":"value"}\n```';
    expect(extractJson(fenced)).toEqual({ key: 'value' });
  });

  it('returns null for invalid JSON', () => {
    expect(extractJson('{not valid json}')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(extractJson(null)).toBeNull();
    expect(extractJson(42)).toBeNull();
    expect(extractJson(undefined)).toBeNull();
  });
});


// ─── handleRequest ────────────────────────────────────────────────────────────

import { handleRequest } from './practice-generate.js';

const { mockVerifyActiveUser, mockConsumeQuotaPersistent, mockCheckRateLimit } = vi.hoisted(() => ({
  mockVerifyActiveUser: vi.fn(),
  mockConsumeQuotaPersistent: vi.fn(),
  mockCheckRateLimit: vi.fn().mockReturnValue(true),
}));

vi.mock('./_shared.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyActiveUser: mockVerifyActiveUser,
    consumeQuotaPersistent: mockConsumeQuotaPersistent,
    createRateLimiter: () => mockCheckRateLimit,
  };
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const VERIFIED_USER = {
  id: 'u1',
  email: 'a@b.com',
  email_confirmed_at: '2026-01-01',
  confirmed_at: null,
};

const VALID_RESPONSE_CARD = {
  question: 'What does display: flex do?',
  options: ['Creates a flex container', 'Hides the element', 'Adds a border', 'Centers text'],
  correct: 0,
  explanation: 'Setting display to flex makes the element a flex container.',
  code: null,
};

function makeEvent(overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: { authorization: 'Bearer tok' },
    body: JSON.stringify({ topic: 'css', concept: 'flexbox' }),
    ...overrides,
  };
}

function openAIOk(card) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ output_text: JSON.stringify(card) }),
  };
}

import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue(true);
  mockVerifyActiveUser.mockResolvedValue(VERIFIED_USER);
  mockConsumeQuotaPersistent.mockResolvedValue(true);
  process.env.OPENAI_API_KEY = 'test-key';
  mockFetch.mockResolvedValue(openAIOk(VALID_RESPONSE_CARD));
});

describe('handleRequest (practice-generate)', () => {
  it('returns 405 for non-POST requests', async () => {
    const res = await handleRequest(makeEvent({ httpMethod: 'GET' }));
    expect(res.statusCode).toBe(405);
  });

  it('returns 500 when OPENAI_API_KEY is absent', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(500);
  });

  it('returns 401 when auth header is missing', async () => {
    const res = await handleRequest(makeEvent({ headers: {} }));
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when verifyActiveUser returns null', async () => {
    mockVerifyActiveUser.mockResolvedValue(null);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when email is not confirmed', async () => {
    mockVerifyActiveUser.mockResolvedValue({ id: 'u1', email_confirmed_at: null, confirmed_at: null });
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(403);
  });

  it('returns 429 when rate limit is hit', async () => {
    mockCheckRateLimit.mockReturnValue(false);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(429);
  });

  it('returns 429 when quota is exhausted', async () => {
    mockConsumeQuotaPersistent.mockResolvedValue(false);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(429);
  });

  it('returns 503 when quota service is unavailable', async () => {
    mockConsumeQuotaPersistent.mockResolvedValue(null);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(503);
  });

  it('returns 400 for an unrecognised topic', async () => {
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ topic: 'python', concept: 'loops' }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toContain('Topic must be');
  });

  it('returns 400 when concept is missing', async () => {
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ topic: 'css', concept: '' }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toContain('Concept');
  });

  it('returns 200 with a valid card on the happy path', async () => {
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.card.question).toBe(VALID_RESPONSE_CARD.question);
    expect(body.card.source).toContain('CSS');
  });

  it('returns 502 when the model returns an invalid card shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ output_text: '{"question":"refused","options":["","","",""],"correct":0,"explanation":"off-topic"}' }),
    });
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(502);
  });

  it('returns 502 when OpenAI call throws', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(502);
  });
});
