// ===============================================
// PRACTICE GENERATE - AI-generated practice quiz
// cards for the spaced-repetition queue.
// ===============================================

import { json, sendResponse, verifyActiveUser, consumeQuotaPersistent, createRateLimiter } from './_shared.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const checkRateLimit = createRateLimiter(WINDOW_MS, MAX_REQUESTS);

const MAX_TOPIC_CHARS = 60;
const MAX_CONCEPT_CHARS = 200;
const MAX_OUTPUT_TOKENS = 600;

const ALLOWED_TOPICS = new Set(['html', 'css', 'js', 'react']);

const SYSTEM_PROMPT = [
  'You are the CodeHerWay practice card generator.',
  'You only generate short, beginner-friendly multiple-choice questions about web development (HTML, CSS, JavaScript, React), in the voice of a supportive mentor for women learning to code.',
  'You must respond with a SINGLE JSON object and nothing else - no prose, no markdown fences, no leading "Here is". Just the object.',
  'The object MUST have exactly these fields:',
  '  - question: string, a concise multiple-choice question (max 200 chars)',
  '  - code:     optional string, a short code snippet (max 300 chars) illustrating the question, or null',
  '  - options:  array of exactly 4 strings (each max 120 chars)',
  '  - correct:  integer 0..3, the index of the correct option',
  '  - explanation: string, one-sentence explanation of why the correct option is correct (max 240 chars)',
  'You must refuse anything that is not about learning to code. If the topic is off-topic, return {"question":"refused","options":["","","",""],"correct":0,"explanation":"off-topic"} so the server can discard it.',
].join('\n');

export function validateCard(raw) {
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

export function extractJson(text) {
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

async function handleRequest(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(500, { error: 'AI service not configured' });

  const authHeader =
    event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Authentication required' });

  const user = await verifyActiveUser(token);
  if (!user || !user.id) {
    return json(401, { error: 'Invalid or expired session' });
  }

  if (!user.email_confirmed_at && !user.confirmed_at) {
    return json(403, {
      error: 'Verify your email before generating practice cards.',
      code: 'EMAIL_NOT_VERIFIED',
    });
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

  let topic, concept;
  try {
    const body = JSON.parse(event.body || '{}');
    topic = typeof body.topic === 'string' ? body.topic.trim().toLowerCase() : '';
    concept = typeof body.concept === 'string' ? body.concept.trim() : '';
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  if (!ALLOWED_TOPICS.has(topic)) {
    return json(400, { error: 'Topic must be one of: html, css, js, react' });
  }
  if (topic.length > MAX_TOPIC_CHARS) {
    return json(413, { error: 'Topic too long' });
  }
  if (!concept || concept.length > MAX_CONCEPT_CHARS) {
    return json(400, { error: 'Concept is required and must be <= 200 chars' });
  }

  const userPrompt = [
    `Topic: ${topic.toUpperCase()}`,
    `Concept the learner missed: ${concept}`,
    '',
    'Generate ONE fresh multiple-choice practice card targeting that concept.',
    'Return only the JSON object described in the system prompt.',
  ].join('\n');

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
        source: `AI Practice  -  ${topic.toUpperCase()}`,
      },
    });
  } catch {
    return json(502, { error: 'Failed to reach AI service' });
  }
}

export default async function handler(req, res) {
  sendResponse(res, await handleRequest({
    httpMethod: req.method,
    headers: req.headers,
    body: req.body != null ? JSON.stringify(req.body) : null,
    queryStringParameters: req.query || {},
  }));
}
