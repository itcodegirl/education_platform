import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRequest } from './ai.js';

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

// ─── helpers ─────────────────────────────────────────────────────────────────

const VERIFIED_USER = {
  id: 'u1',
  email: 'a@b.com',
  email_confirmed_at: '2026-01-01',
  confirmed_at: null,
};

function makeEvent(overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: { authorization: 'Bearer tok' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'What is flexbox?' }] }),
    ...overrides,
  };
}

function makeOpenAIResponse(ok, body) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue(true);
  mockVerifyActiveUser.mockResolvedValue(VERIFIED_USER);
  mockConsumeQuotaPersistent.mockResolvedValue(true);
  process.env.OPENAI_API_KEY = 'test-key';
  mockFetch.mockResolvedValue(makeOpenAIResponse(true, { output_text: 'Flexbox is a layout model.' }));
});

// ─── method guard ─────────────────────────────────────────────────────────────
describe('method guard', () => {
  it('returns 405 for non-POST requests', async () => {
    const res = await handleRequest(makeEvent({ httpMethod: 'GET' }));
    expect(res.statusCode).toBe(405);
  });
});

// ─── API key guard ────────────────────────────────────────────────────────────
describe('API key guard', () => {
  it('returns 500 when OPENAI_API_KEY is not set', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});

// ─── auth guards ─────────────────────────────────────────────────────────────
describe('auth guards', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await handleRequest(makeEvent({ headers: {} }));
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when verifyActiveUser returns null', async () => {
    mockVerifyActiveUser.mockResolvedValue(null);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when email is not confirmed', async () => {
    mockVerifyActiveUser.mockResolvedValue({
      id: 'u1',
      email_confirmed_at: null,
      confirmed_at: null,
    });
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe('EMAIL_NOT_VERIFIED');
  });
});

// ─── rate limit / quota guards ────────────────────────────────────────────────
describe('rate limit and quota guards', () => {
  it('returns 429 when the per-user rate limiter fires', async () => {
    mockCheckRateLimit.mockReturnValue(false);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(429);
  });

  it('returns 429 when consumeQuotaPersistent returns false', async () => {
    mockConsumeQuotaPersistent.mockResolvedValue(false);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(429);
  });

  it('returns 503 when consumeQuotaPersistent returns null', async () => {
    mockConsumeQuotaPersistent.mockResolvedValue(null);
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(503);
  });
});

// ─── input validation ─────────────────────────────────────────────────────────
describe('input validation', () => {
  it('returns 400 for invalid JSON body', async () => {
    const res = await handleRequest(makeEvent({ body: 'not-json' }));
    expect(res.statusCode).toBe(400);
  });

  it('returns 413 when system prompt exceeds the char limit', async () => {
    const res = await handleRequest(makeEvent({
      body: JSON.stringify({
        system: 'x'.repeat(2001),
        messages: [{ role: 'user', content: 'hi' }],
      }),
    }));
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toContain('System prompt');
  });

  it('returns 413 when message array exceeds the count limit', async () => {
    const messages = Array.from({ length: 21 }, (_, i) => ({ role: 'user', content: `msg ${i}` }));
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ messages }) }));
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toContain('Too many messages');
  });

  it('returns 413 when a single message exceeds the size limit', async () => {
    const res = await handleRequest(makeEvent({
      body: JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(4001) }] }),
    }));
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toContain('size limit');
  });

  it('returns 413 when the total conversation exceeds the char budget', async () => {
    const messages = Array.from({ length: 4 }, () => ({ role: 'user', content: 'x'.repeat(3001) }));
    const res = await handleRequest(makeEvent({ body: JSON.stringify({ messages }) }));
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toContain('too large');
  });

  it('returns 400 when no clean messages remain after filtering', async () => {
    const res = await handleRequest(makeEvent({
      body: JSON.stringify({ messages: [{ role: 'user', content: '' }] }),
    }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toContain('No AI input');
  });
});

// ─── OpenAI forwarding ────────────────────────────────────────────────────────
describe('OpenAI forwarding', () => {
  it('returns 200 with the AI text on a successful OpenAI response', async () => {
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).text).toBe('Flexbox is a layout model.');
  });

  it('returns 502 when OpenAI returns a 5xx error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Internal server error' } }),
    });
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(502);
  });

  it('passes through OpenAI 4xx status codes', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: 'Bad request' } }),
    });
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const res = await handleRequest(makeEvent());
    expect(res.statusCode).toBe(502);
  });

  it('prepends the guardrail prefix to the system prompt', async () => {
    await handleRequest(makeEvent({
      body: JSON.stringify({
        system: 'Custom context.',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const systemItem = body.input.find((item) => item.role === 'system');
    expect(systemItem.content[0].text).toContain('CodeHerWay learning assistant');
    expect(systemItem.content[0].text).toContain('Custom context.');
  });

  it('clamps maxTokens to MAX_OUTPUT_TOKENS (1024)', async () => {
    await handleRequest(makeEvent({
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 99999,
      }),
    }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.max_output_tokens).toBe(1024);
  });

  it('preserves assistant role in the input array', async () => {
    await handleRequest(makeEvent({
      body: JSON.stringify({
        messages: [
          { role: 'assistant', content: 'Hello!' },
          { role: 'user', content: 'Follow up.' },
        ],
      }),
    }));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const roles = body.input.map((item) => item.role);
    expect(roles).toContain('assistant');
    expect(roles).toContain('user');
  });
});
