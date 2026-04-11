// ═══════════════════════════════════════════════
// AI PROXY — Authenticated, rate-limited gateway
// to the OpenAI API. Never expose API keys to
// the browser; all AI calls go through here.
// ═══════════════════════════════════════════════

const OPENAI_URL = 'https://api.openai.com/v1/responses';

// ─── Rate limiting (per function instance) ─────
// Resets on cold start — good enough for basic abuse prevention.
// For stricter limits, move to a database counter.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;  // 10 requests per minute per user
const rateLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  let timestamps = rateLimits.get(userId) || [];
  timestamps = timestamps.filter((t) => t > now - WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return false;
  }

  timestamps.push(now);
  rateLimits.set(userId, timestamps);

  // Prevent memory leak: prune inactive users every 100 entries
  if (rateLimits.size > 200) {
    for (const [key, ts] of rateLimits) {
      if (ts.every((t) => t <= now - WINDOW_MS)) rateLimits.delete(key);
    }
  }

  return true;
}

// ─── Helpers ───────────────────────────────────
function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function toInputItems(system, messages) {
  const items = [];

  if (system) {
    items.push({
      role: 'system',
      content: [{ type: 'input_text', text: system }],
    });
  }

  for (const message of messages || []) {
    if (!message?.content) continue;
    items.push({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'input_text', text: message.content }],
    });
  }

  return items;
}

async function verifyUser(token) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey,
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Handler ───────────────────────────────────
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  // 1. Check API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'AI service not configured' });
  }

  // 2. Authenticate the user
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return json(401, { error: 'Authentication required' });
  }

  const user = await verifyUser(token);
  if (!user || !user.id) {
    return json(401, { error: 'Invalid or expired session' });
  }

  // 3. Rate-limit per user
  if (!checkRateLimit(user.id)) {
    return json(429, { error: 'Too many requests. Please wait a moment and try again.' });
  }

  // 4. Parse + validate the request
  let system, messages, maxTokens;
  try {
    const body = JSON.parse(event.body || '{}');
    system = body.system || '';
    messages = body.messages || [];
    maxTokens = body.maxTokens || 800;
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  // Cap max tokens to prevent abuse
  maxTokens = Math.min(maxTokens, 1024);

  const input = toInputItems(system, messages);
  if (input.length === 0) {
    return json(400, { error: 'No AI input provided' });
  }

  // 5. Call OpenAI API
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input,
        max_output_tokens: maxTokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.error?.message || 'AI request failed';
      return json(response.status >= 500 ? 502 : response.status, { error: message });
    }

    return json(200, { text: data.output_text || '' });
  } catch (error) {
    return json(502, { error: 'Failed to reach AI service' });
  }
}
