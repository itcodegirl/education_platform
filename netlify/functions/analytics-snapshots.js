import { getSupabaseConfig, json, verifyUser } from './_shared.js';

const DEFAULT_DAYS = 30;
const MIN_DAYS = 1;
const MAX_DAYS = 180;

function parseDays(value) {
  const raw = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(raw)) return DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, raw));
}

async function callRpc({ token, name, payload }) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase environment is not configured');
  }

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'object' && data?.error) ||
      'RPC call failed';
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

async function ensureAdmin(token) {
  const isAdmin = await callRpc({ token, name: 'is_admin', payload: {} });
  return isAdmin === true;
}

export async function handler(event) {
  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return json(405, { error: 'Method not allowed' });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Authentication required' });

  const user = await verifyUser(token);
  if (!user?.id) {
    return json(401, { error: 'Invalid or expired session' });
  }

  let requestBody = {};
  if (event.httpMethod === 'POST') {
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }
  }

  const days = parseDays(
    requestBody.days ?? event.queryStringParameters?.days ?? DEFAULT_DAYS,
  );
  const shouldRefresh = Boolean(requestBody.refresh === true);

  try {
    const admin = await ensureAdmin(token);
    if (!admin) return json(403, { error: 'Admin privileges required' });

    if (shouldRefresh) {
      await callRpc({
        token,
        name: 'refresh_analytics_daily_funnel',
        payload: { p_days_back: days },
      });
    }

    const snapshots = await callRpc({
      token,
      name: 'get_analytics_daily_funnel',
      payload: { p_days: days },
    });

    return json(200, {
      days,
      refreshed: shouldRefresh,
      snapshots: Array.isArray(snapshots) ? snapshots : [],
    });
  } catch (error) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      return json(error.statusCode, { error: 'Admin privileges required' });
    }

    if (error?.statusCode >= 400 && error?.statusCode < 500) {
      return json(error.statusCode, { error: error.message || 'Request failed' });
    }

    return json(502, { error: 'Analytics snapshot service unavailable' });
  }
}
