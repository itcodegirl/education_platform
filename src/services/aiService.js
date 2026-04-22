// ═══════════════════════════════════════════════
// AI SERVICE — Client-side wrapper around the
// authenticated Netlify Function AI proxy.
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';

function getAIErrorMessage(status, serverMessage) {
  if (status === 401 || status === 403) {
    return 'Your session expired. Sign in again and retry your message.';
  }
  if (status === 413) {
    return 'That message is too long. Shorten it and try again.';
  }
  if (status === 429) {
    return 'You are sending requests too quickly. Wait a moment and try again.';
  }
  if (status >= 500) {
    return 'Cinova AI tutor is temporarily unavailable. Please try again soon.';
  }
  return serverMessage || 'AI request failed';
}

async function callAI(payload) {
  // Get the current session token to authenticate the request
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to use the AI tutor.');
  }

  const response = await fetch('/.netlify/functions/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const serverMessage = getAIErrorMessage(response.status, data?.error);
    throw new Error(`[${response.status}] ${serverMessage}`);
  }

  return data.text || '';
}

/**
 * Ask the lesson AI tutor using prior conversation history.
 */
export function askLessonTutor({
  system,
  history,
  question,
}) {
  return callAI({
    system,
    messages: [...history, { role: 'user', content: question }],
    maxTokens: 1000,
  });
}

/**
 * Request a concise beginner-friendly explanation of a code snippet.
 */
export function explainCode({ system, code }) {
  return callAI({
    system,
    messages: [{ role: 'user', content: code }],
    maxTokens: 800,
  });
}

/**
 * Ask the challenge tutor for guidance on the current coding challenge.
 */
export function askChallengeTutor({
  system,
  question,
}) {
  return callAI({
    system,
    messages: [{ role: 'user', content: question }],
    maxTokens: 600,
  });
}
