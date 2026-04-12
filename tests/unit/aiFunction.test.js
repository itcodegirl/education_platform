// ═══════════════════════════════════════════════
// AI NETLIFY FUNCTION TESTS — Pins the input-
// validation limits on the server-side proxy so
// payload DoS regressions can't sneak in.
// ═══════════════════════════════════════════════

import { describe, test, expect, beforeEach, vi } from 'vitest';

// The handler calls Supabase to verify tokens and push rate-limit counters.
// We stub global.fetch for both so the test is hermetic.

const VALID_TOKEN = 'test-token';
const VALID_USER = { id: 'user-1' };

function stubFetch() {
  global.fetch = vi.fn(async (url, opts) => {
    const href = String(url);
    if (href.endsWith('/auth/v1/user')) {
      return {
        ok: true,
        status: 200,
        json: async () => VALID_USER,
      };
    }
    // Rate limiter read
    if (href.includes('/rest/v1/ai_rate_limits') && (!opts || opts.method !== 'POST')) {
      return { ok: true, status: 200, json: async () => [] };
    }
    // Rate limiter upsert
    if (href.includes('/rest/v1/ai_rate_limits') && opts?.method === 'POST') {
      return { ok: true, status: 201, text: async () => '' };
    }
    // Upstream OpenAI call — happy path
    if (href === 'https://api.openai.com/v1/responses') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ output_text: 'hi from the model' }),
      };
    }
    throw new Error(`unexpected fetch to ${href}`);
  });
}

async function callHandler(body, { method = 'POST', token = VALID_TOKEN } = {}) {
  // Reimport the module fresh each call so module-level state (the
  // in-memory rate-limit fallback map) doesn't leak between tests.
  vi.resetModules();
  const { handler } = await import('../../netlify/functions/ai.js');
  return handler({
    httpMethod: method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('netlify/functions/ai.js handler', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon';
    // Force the in-memory rate-limit fallback by leaving the service key unset
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    stubFetch();
  });

  test('rejects non-POST methods', async () => {
    const res = await callHandler({}, { method: 'GET' });
    expect(res.statusCode).toBe(405);
  });

  test('returns 401 when no auth header is present', async () => {
    const res = await callHandler({ messages: [{ role: 'user', content: 'hi' }] }, { token: null });
    expect(res.statusCode).toBe(401);
  });

  test('returns 500 when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await callHandler({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.statusCode).toBe(500);
  });

  test('rejects oversized raw bodies with 413', async () => {
    const huge = 'x'.repeat(65 * 1024); // > 64 KB cap
    const res = await callHandler(huge);
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toMatch(/too large/i);
  });

  test('rejects payloads with too many messages', async () => {
    const messages = Array.from({ length: 41 }, (_, i) => ({
      role: 'user', content: `msg ${i}`,
    }));
    const res = await callHandler({ messages });
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toMatch(/too many messages/i);
  });

  test('rejects single messages over the per-message char cap', async () => {
    const messages = [{ role: 'user', content: 'a'.repeat(8001) }];
    const res = await callHandler({ messages });
    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.body).error).toMatch(/too long/i);
  });

  test('rejects an oversized system prompt', async () => {
    const res = await callHandler({
      system: 's'.repeat(8001),
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.statusCode).toBe(413);
  });

  test('rejects a malformed JSON body with 400', async () => {
    const res = await callHandler('{not valid json');
    expect(res.statusCode).toBe(400);
  });

  test('rejects an empty messages array with 400', async () => {
    const res = await callHandler({ messages: [] });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/no ai input/i);
  });

  test('accepts a normal request and returns the model output', async () => {
    const res = await callHandler({
      system: 'you are helpful',
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ text: 'hi from the model' });
  });
});
