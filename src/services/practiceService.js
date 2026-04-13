// ═══════════════════════════════════════════════
// PRACTICE SERVICE — Client-side wrapper around the
// practice-generate Netlify Function. Returns a
// fully validated { question, code, options, correct,
// explanation, source } card ready to insert into
// sr_cards via addSRCard().
// ═══════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';

export async function generatePracticeCard({ topic, concept }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to generate practice cards.');
  }

  const response = await fetch('/.netlify/functions/practice-generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ topic, concept }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate practice card');
  }
  if (!data.card) {
    throw new Error('Server returned no card');
  }
  return data.card;
}
