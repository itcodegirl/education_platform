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

export async function askAI({ system, messages, maxTokens = 1000 }) {
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
