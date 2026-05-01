// ===============================================
// AI SERVICE - Client-side wrapper around the
// authenticated Netlify Function AI proxy.
// ===============================================

import { supabase } from '../lib/supabaseClient';

// AI_ERROR_CODES — stable identifiers callers can switch on
// without regex-matching error message strings. Each one has a
// matching userMessage built into AIServiceError for cases where
// the caller just wants to display something.
export const AI_ERROR_CODES = Object.freeze({
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
});

const DEFAULT_USER_MESSAGES = Object.freeze({
  [AI_ERROR_CODES.UNAUTHENTICATED]: 'Your session expired. Sign in again and retry your message.',
  [AI_ERROR_CODES.PAYLOAD_TOO_LARGE]: 'That message is too long. Shorten it and try again.',
  [AI_ERROR_CODES.RATE_LIMITED]: 'You are sending requests too quickly. Wait a moment and try again.',
  [AI_ERROR_CODES.SERVER_UNAVAILABLE]: 'CodeHerWay AI tutor is temporarily unavailable. Please try again soon.',
  [AI_ERROR_CODES.NETWORK]: 'You appear offline right now. Reconnect and try again.',
  [AI_ERROR_CODES.UNKNOWN]: 'AI request failed. Please try again in a moment.',
});

export class AIServiceError extends Error {
  constructor({ code, status, userMessage, cause }) {
    super(userMessage || DEFAULT_USER_MESSAGES[code] || 'AI request failed');
    this.name = 'AIServiceError';
    this.code = code || AI_ERROR_CODES.UNKNOWN;
    this.status = typeof status === 'number' ? status : null;
    this.userMessage = this.message;
    if (cause) this.cause = cause;
  }
}

function classifyHttpStatus(status) {
  if (status === 401 || status === 403) return AI_ERROR_CODES.UNAUTHENTICATED;
  if (status === 413) return AI_ERROR_CODES.PAYLOAD_TOO_LARGE;
  if (status === 429) return AI_ERROR_CODES.RATE_LIMITED;
  if (status >= 500) return AI_ERROR_CODES.SERVER_UNAVAILABLE;
  return AI_ERROR_CODES.UNKNOWN;
}

async function callAI(payload) {
  // Get the current session token to authenticate the request
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new AIServiceError({
      code: AI_ERROR_CODES.UNAUTHENTICATED,
      userMessage: 'You must be signed in to use the AI tutor.',
    });
  }

  let response;
  try {
    response = await fetch('/.netlify/functions/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (cause) {
    // fetch() rejects only on network failure (DNS, offline, CORS, etc).
    // HTTP 4xx/5xx still resolve with response.ok === false.
    throw new AIServiceError({ code: AI_ERROR_CODES.NETWORK, cause });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = classifyHttpStatus(response.status);
    throw new AIServiceError({
      code,
      status: response.status,
      userMessage: data?.error || DEFAULT_USER_MESSAGES[code],
    });
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


