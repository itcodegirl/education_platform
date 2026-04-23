import { getSupabaseConfig, json, verifyUser } from './_shared.js';

const MAX_BATCH_SIZE = 50;
const MAX_EVENT_NAME_CHARS = 80;
const MAX_PATH_CHARS = 300;

function toSafeText(value, maxChars, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxChars) : fallback;
}

function toSafeTimestamp(value) {
  if (typeof value !== 'string') return new Date().toISOString();
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

function toSafePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  return payload;
}

function toInsertRow(rawEvent, userId) {
  if (!rawEvent || typeof rawEvent !== 'object') return null;

  const eventName = toSafeText(rawEvent.name, MAX_EVENT_NAME_CHARS);
  if (!eventName) return null;

  return {
    user_id: userId,
    event_name: eventName,
    path: toSafeText(rawEvent.path, MAX_PATH_CHARS, '/'),
    payload: toSafePayload(rawEvent.payload),
    occurred_at: toSafeTimestamp(rawEvent.ts),
    source: 'web',
  };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return json(401, { error: 'Authentication required' });
  }

  const user = await verifyUser(token);
  if (!user?.id) {
    return json(401, { error: 'Invalid or expired session' });
  }

  let events = [];
  try {
    const body = JSON.parse(event.body || '{}');
    events = Array.isArray(body.events) ? body.events : [];
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  if (events.length === 0) {
    return json(400, { error: 'No events provided' });
  }
  if (events.length > MAX_BATCH_SIZE) {
    return json(413, { error: `Batch exceeds ${MAX_BATCH_SIZE} events` });
  }

  const rows = events
    .map((entry) => toInsertRow(entry, user.id))
    .filter((entry) => Boolean(entry));

  if (!rows.length) {
    return json(400, { error: 'No valid analytics events' });
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return json(500, { error: 'Supabase environment is not configured' });
  }

  try {
    const response = await fetch(`${url}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '');
      return json(
        response.status >= 500 ? 502 : response.status,
        { error: responseBody || 'Failed to persist analytics events' },
      );
    }

    return json(202, { accepted: rows.length });
  } catch {
    return json(502, { error: 'Analytics ingestion unavailable' });
  }
}
