// ═══════════════════════════════════════════════
// AI PROXY — Authenticated, rate-limited gateway
// to the Anthropic API. Never expose API keys to
// the browser; all AI calls go through here.
// ═══════════════════════════════════════════════

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
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

  if (!messages.length) {
    return json(400, { error: 'No messages provided' });
  }

  // Cap max tokens to prevent abuse
  maxTokens = Math.min(maxTokens, 1024);

  // 5. Call Anthropic API
  try {
    const requestBody = {
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: messages
        .filter((m) => m && m.content)
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
    };

    // Only include system if non-empty
    if (system) {
      requestBody.system = system;
    }

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.error?.message || 'AI request failed';
      // Don't leak internal error details to the client
      return json(response.status >= 500 ? 502 : response.status, {
        error: response.status === 529 ? 'AI service is busy. Try again shortly.' : message,
      });
    }

    const text = data.content?.[0]?.text || '';
    return json(200, { text });
  } catch (error) {
    return json(502, { error: 'Failed to reach AI service' });
  }
}
