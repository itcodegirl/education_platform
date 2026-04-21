// ═══════════════════════════════════════════════
// PRACTICE GENERATE — AI-generated practice quiz
// cards for the spaced-repetition queue.
//
// Given a topic + concept, calls OpenAI with a
// strict schema prompt and returns a JSON-validated
// quiz card ({ question, options[], correct,
// explanation }) that the client can insert into
// sr_cards.
//
// Security controls (same posture as ai.js):
//   1. Require a valid Supabase session.
//   2. Authoritative Postgres rate limit via the
//      consume_ai_quota() RPC. Fails closed on
//      unreachable RPC.
//   3. In-memory rate limit as defense-in-depth.
//   4. Payload caps (topic + concept length).
//   5. Mandatory server-side system prompt (client
//      cannot override the persona or schema).
//   6. Strict JSON validation on the model output.
//      Invalid shapes return 502 rather than
//      forwarding a malformed card to the client.
// ═══════════════════════════════════════════════

const OPENAI_URL = 'https://api.openai.com/v1/responses';

// ─── In-memory rate limit (defense in depth) ───
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const rateLimits = new Map();

// ─── Payload limits ────────────────────────────
const MAX_TOPIC_CHARS = 60;
const MAX_CONCEPT_CHARS = 200;
const MAX_OUTPUT_TOKENS = 600;

// ─── Allowed topics (must match data/*/course.js ids) ─
const ALLOWED_TOPICS = new Set(['html', 'css', 'js', 'react', 'python']);

// ─── System prompt (SERVER-SIDE, never client-controlled) ─
const SYSTEM_PROMPT = [
  'You are the CodeHerWay practice card generator.',
  'You only generate short, beginner-friendly multiple-choice questions about web development and Python, in the voice of a supportive mentor for women learning to code.',
  'You must respond with a SINGLE JSON object and nothing else — no prose, no markdown fences, no leading "Here is". Just the object.',
  'The object MUST have exactly these fields:',
  '  - question: string, a concise multiple-choice question (max 200 chars)',
  '  - code:     optional string, a short code snippet (max 300 chars) illustrating the question, or null',
  '  - options:  array of exactly 4 strings (each max 120 chars)',
  '  - correct:  integer 0..3, the index of the correct option',
  '  - explanation: string, one-sentence explanation of why the correct option is correct (max 240 chars)',
  'You must refuse anything that is not about learning to code. If the topic is off-topic, return {"question":"refused","options":["","","",""],"correct":0,"explanation":"off-topic"} so the server can discard it.',
].join('\n');

function checkRateLimit(userId) {
  const now = Date.now();
  let timestamps = rateLimits.get(userId) || [];
  timestamps = timestamps.filter((t) => t > now - WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return false;
  timestamps.push(now);
  rateLimits.set(userId, timestamps);
  if (rateLimits.size > 200) {
    for (const [key, ts] of rateLimits) {
      if (ts.every((t) => t <= now - WINDOW_MS)) rateLimits.delete(key);
    }
  }
  return true;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Prevent MIME-type sniffing on JSON responses.
      'X-Content-Type-Options': 'nosniff',
    },
    body: JSON.stringify(body),
  };
}

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  };
}

async function verifyUser(token) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: key },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function consumeQuotaPersistent(token) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/consume_ai_quota`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data === true;
  } catch {
    return null;
  }
}

// ─── JSON validation ─────────────────────────
function validateCard(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (!question || question === 'refused' || question.length > 240) return null;

  const options = Array.isArray(raw.options) ? raw.options : null;
  if (!options || options.length !== 4) return null;
  for (const opt of options) {
    if (typeof opt !== 'string' || opt.length === 0 || opt.length > 160) return null;
  }

  const correct = Number.isInteger(raw.correct) ? raw.correct : -1;
  if (correct < 0 || correct > 3) return null;

  const explanation =
    typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  if (!explanation || explanation.length > 300) return null;

  const code =
    typeof raw.code === 'string' && raw.code.length > 0 && raw.code.length <= 400
      ? raw.code
      : null;

  return { question, code, options, correct, explanation };
}

// Strip any accidental code fences the model might wrap the JSON in.
function extractJson(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// ─── Handler ─────────────────────────────────
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(500, { error: 'AI service not configured' });

  const authHeader =
    event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Authentication required' });

  const user = await verifyUser(token);
  if (!user || !user.id) {
    return json(401, { error: 'Invalid or expired session' });
  }

  if (!checkRateLimit(user.id)) {
    return json(429, { error: 'Too many requests. Please wait a moment.' });
  }

  const quotaOk = await consumeQuotaPersistent(token);
  if (quotaOk === false) {
    return json(429, { error: 'Too many requests. Please wait a moment.' });
  }
  if (quotaOk === null) {
    return json(503, { error: 'Rate limiter unavailable, try again shortly.' });
  }

  // ─── Parse + validate request ─────────────
  let topic, concept;
  try {
    const body = JSON.parse(event.body || '{}');
    topic = typeof body.topic === 'string' ? body.topic.trim().toLowerCase() : '';
    concept = typeof body.concept === 'string' ? body.concept.trim() : '';
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  if (!ALLOWED_TOPICS.has(topic)) {
    return json(400, { error: 'Topic must be one of: html, css, js, react, python' });
  }
  if (topic.length > MAX_TOPIC_CHARS) {
    return json(413, { error: 'Topic too long' });
  }
  if (!concept || concept.length > MAX_CONCEPT_CHARS) {
    return json(400, { error: 'Concept is required and must be ≤ 200 chars' });
  }

  const userPrompt = [
    `Topic: ${topic.toUpperCase()}`,
    `Concept the learner missed: ${concept}`,
    '',
    'Generate ONE fresh multiple-choice practice card targeting that concept.',
    'Return only the JSON object described in the system prompt.',
  ].join('\n');

  // ─── Call OpenAI ──────────────────────────
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        max_output_tokens: MAX_OUTPUT_TOKENS,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data.error?.message || 'AI request failed';
      return json(response.status >= 500 ? 502 : response.status, { error: message });
    }

    const raw = extractJson(data.output_text || '');
    const card = validateCard(raw);
    if (!card) {
      return json(502, {
        error:
          'The model returned a card that did not match the expected shape. Please try again.',
      });
    }

    return json(200, {
      card: {
        ...card,
        source: `AI Practice · ${topic.toUpperCase()}`,
      },
    });
  } catch {
    return json(502, { error: 'Failed to reach AI service' });
  }
}
