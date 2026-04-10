// ═══════════════════════════════════════════════
// AI CLIENT — Centralized Anthropic API access
//
// Currently calls the Anthropic API directly.
// To move to a backend proxy, change ENDPOINT and
// remove the x-api-key header below.
//
// For production: create a Supabase Edge Function
// at /functions/v1/ai-chat that proxies requests
// and keeps the API key server-side.
// ═══════════════════════════════════════════════

import { AI_MODEL } from './helpers';

const ENDPOINT = import.meta.env.VITE_AI_PROXY_URL || 'https://api.anthropic.com/v1/messages';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

// ─── Rate Limiting (3 requests per 60 seconds) ──
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;
const requestTimestamps = [];

function checkRateLimit() {
  const now = Date.now();
  // Remove timestamps outside the window
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT) {
    const waitSeconds = Math.ceil((requestTimestamps[0] + RATE_WINDOW_MS - now) / 1000);
    throw new Error(`Slow down! You can ask ${RATE_LIMIT} questions per minute. Try again in ${waitSeconds}s.`);
  }
  requestTimestamps.push(now);
}

// ─── API Call ────────────────────────────────────
export async function askAI({ system, messages, maxTokens = 1000 }) {
  checkRateLimit();

  const headers = { 'Content-Type': 'application/json' };

  // Only attach API key for direct Anthropic calls (not proxied)
  if (API_KEY && ENDPOINT.includes('anthropic.com')) {
    headers['x-api-key'] = API_KEY;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}
