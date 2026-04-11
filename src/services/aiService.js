import { supabase } from '../lib/supabaseClient';

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
    throw new Error(data.error || 'AI request failed');
  }

  return data.text || '';
}

export function askLessonTutor({ system, history, question }) {
  return callAI({
    system,
    messages: [...history, { role: 'user', content: question }],
    maxTokens: 1000,
  });
}

export function explainCode({ system, code }) {
  return callAI({
    system,
    messages: [{ role: 'user', content: code }],
    maxTokens: 800,
  });
}

export function askChallengeTutor({ system, question }) {
  return callAI({
    system,
    messages: [{ role: 'user', content: question }],
    maxTokens: 600,
  });
}
