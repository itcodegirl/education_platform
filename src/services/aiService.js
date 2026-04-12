import { supabase } from '../lib/supabaseClient';

async function callAI(payload) {
  // Get the current session token to authenticate the request
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to use the AI tutor.');
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
  } catch (networkError) {
    throw new Error("Couldn't reach the AI tutor. Check your connection and try again.");
  }

  // Read the body once as text so a malformed JSON response from an
  // upstream crash or proxy page doesn't get silently dropped.
  const rawBody = await response.text();
  let data = null;
  let parseError = null;
  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch (err) {
      parseError = err;
    }
  }

  if (!response.ok) {
    const message = data?.error
      || (parseError && `AI request failed (HTTP ${response.status})`)
      || `AI request failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  if (parseError) {
    throw new Error('AI returned an unreadable response. Please try again.');
  }

  return data?.text || '';
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
