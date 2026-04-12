// ═══════════════════════════════════════════════
// AI PROXY — Authenticated, rate-limited gateway
// to the OpenAI API. Never expose API keys to
// the browser; all AI calls go through here.
// ═══════════════════════════════════════════════

const OPENAI_URL = 'https://api.openai.com/v1/responses';

// ─── Rate limiting ─────────────────────────────
// Primary: persistent counters in Supabase (public.ai_rate_limits), so limits
// survive cold starts and are shared across function instances.
// Fallback: per-instance in-memory map for local dev when the service-role
// key isn't configured.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;  // 10 requests per minute per user

const memoryRateLimits = new Map();

function checkRateLimitMemory(userId) {
  const now = Date.now();
  let timestamps = memoryRateLimits.get(userId) || [];
  timestamps = timestamps.filter((t) => t > now - WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) return false;

  timestamps.push(now);
  memoryRateLimits.set(userId, timestamps);

  if (memoryRateLimits.size > 200) {
    for (const [key, ts] of memoryRateLimits) {
      if (ts.every((t) => t <= now - WINDOW_MS)) memoryRateLimits.delete(key);
    }
  }
  return true;
}

// Supabase-backed limiter. Uses the REST API with the service-role key so it
// can bypass RLS on public.ai_rate_limits. Returns:
//   true  → request allowed (counter updated)
//   false → user is over the limit
//   null  → transient/config error; caller should fall back to the memory limiter
async function checkRateLimitSupabase(userId) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
  const endpoint = `${supabaseUrl}/rest/v1/ai_rate_limits`;
  const now = Date.now();
  const windowCutoffIso = new Date(now - WINDOW_MS).toISOString();
  const nowIso = new Date(now).toISOString();

  try {
    // 1. Load the current row for this user, if any.
    const readRes = await fetch(
      `${endpoint}?user_id=eq.${encodeURIComponent(userId)}&select=window_start,request_count`,
      { headers },
    );
    if (!readRes.ok) return null;
    const rows = await readRes.json();
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    // 2. Decide whether we're in the same window or starting a new one.
    const inWindow = row && row.window_start > windowCutoffIso;
    const nextCount = inWindow ? row.request_count + 1 : 1;
    const nextWindowStart = inWindow ? row.window_start : nowIso;

    if (nextCount > MAX_REQUESTS) return false;

    // 3. Upsert the updated counter. on_conflict=user_id merges rows atomically.
    const writeRes = await fetch(
      `${endpoint}?on_conflict=user_id`,
      {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          user_id: userId,
          window_start: nextWindowStart,
          request_count: nextCount,
          updated_at: nowIso,
        }),
      },
    );
    if (!writeRes.ok) return null;
    return true;
  } catch {
    return null;
  }
}

async function checkRateLimit(userId) {
  const result = await checkRateLimitSupabase(userId);
  if (result === null) return checkRateLimitMemory(userId);
  return result;
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

// Returns:
//   true  → user is disabled and must be blocked
//   false → user is active
//   null  → couldn't determine (service key missing / network error)
// Uses the service-role key so the lookup still succeeds after the new
// disabled-user RLS policies (which would otherwise return zero rows for
// the disabled user's own profile on an UPDATE, but SELECT is still open).
async function isUserDisabled(userId) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=is_disabled`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return row?.is_disabled === true;
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

  // Block disabled users. A still-valid Supabase JWT shouldn't be enough
  // to drain OpenAI quota after an admin has suspended the account. We
  // fail closed when the service-role key is configured and the lookup
  // indicates disabled; we fail open (allow) only when the lookup itself
  // returned null (service key missing / transient network error), which
  // mirrors how the Supabase-backed rate limiter degrades.
  const disabled = await isUserDisabled(user.id);
  if (disabled === true) {
    return json(403, { error: 'Account disabled' });
  }

  // 3. Rate-limit per user (persistent via Supabase, with in-memory fallback)
  const allowed = await checkRateLimit(user.id);
  if (!allowed) {
    return json(429, { error: 'Too many requests. Please wait a moment and try again.' });
  }

  // 4. Reject oversized bodies before parsing so a malicious or buggy client
  // can't OOM the function with a giant messages array.
  const MAX_BODY_BYTES = 64 * 1024; // 64 KB is plenty for a tutor prompt
  if (event.body && event.body.length > MAX_BODY_BYTES) {
    return json(413, { error: 'Request too large' });
  }

  // 5. Parse + validate the request
  let system, messages, maxTokens;
  try {
    const body = JSON.parse(event.body || '{}');
    system = typeof body.system === 'string' ? body.system : '';
    messages = Array.isArray(body.messages) ? body.messages : [];
    maxTokens = Number.isFinite(body.maxTokens) ? body.maxTokens : 800;
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  // Defensive caps on nested fields so a well-formed-but-huge JSON body
  // (still under MAX_BODY_BYTES) can't smuggle in unbounded content.
  if (messages.length > 40) {
    return json(413, { error: 'Too many messages in request' });
  }
  const MAX_MESSAGE_CHARS = 8000;
  if (
    system.length > MAX_MESSAGE_CHARS
    || messages.some(m => typeof m?.content === 'string' && m.content.length > MAX_MESSAGE_CHARS)
  ) {
    return json(413, { error: 'Message content too long' });
  }

  // Cap max tokens to prevent abuse
  maxTokens = Math.min(Math.max(maxTokens, 1), 1024);

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
      // Scrub and cap upstream error messages before relaying them to the
      // client. Prevents OpenAI from accidentally leaking hostnames, keys,
      // or long stack traces through this proxy.
      const rawMessage = data.error?.message || 'AI request failed';
      const safeMessage = String(rawMessage)
        .replace(/\b(sk|pk|Bearer)[-_]\S+/gi, '***')
        .replace(/\bhttps?:\/\/\S+/gi, '***')
        .slice(0, 200);
      return json(
        response.status >= 500 ? 502 : response.status,
        { error: safeMessage || 'AI request failed' },
      );
    }

    return json(200, { text: data.output_text || '' });
  } catch (error) {
    return json(502, { error: 'Failed to reach AI service' });
  }
}
