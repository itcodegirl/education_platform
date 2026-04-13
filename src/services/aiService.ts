// ═══════════════════════════════════════════════
// AI SERVICE — Client-side wrapper around the
// authenticated Netlify Function AI proxy.
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';
import type { AICallPayload, AIMessage } from './supabaseTypes';

async function callAI(payload: AICallPayload): Promise<string> {
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

  const data = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }

  return data.text || '';
}

export function askLessonTutor({
  system,
  history,
  question,
}: {
  system: string;
  history: AIMessage[];
  question: string;
}) {
  return callAI({
    system,
    messages: [...history, { role: 'user', content: question }],
    maxTokens: 1000,
  });
}

export function explainCode({ system, code }: { system: string; code: string }) {
  return callAI({
    system,
    messages: [{ role: 'user', content: code }],
    maxTokens: 800,
  });
}

export function askChallengeTutor({
  system,
  question,
}: {
  system: string;
  question: string;
}) {
  return callAI({
    system,
    messages: [{ role: 'user', content: question }],
    maxTokens: 600,
  });
}
