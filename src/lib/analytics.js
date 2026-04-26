import { supabase } from './supabaseClient';

const ANALYTICS_QUEUE_KEY = '__cinovaAnalyticsQueue';
const ANALYTICS_STORAGE_KEY = 'cinova.analytics.queue.v1';
const ANALYTICS_EVENT_NAME = 'cinova:analytics';
const ANALYTICS_DEBUG_STORAGE_KEY = 'debug-analytics';
const MAX_ANALYTICS_QUEUE = 200;
const MAX_EVENT_NAME_CHARS = 80;
const FLUSH_BATCH_SIZE = 25;
const FLUSH_TRIGGER_SIZE = 10;
const FLUSH_INTERVAL_MS = 30_000;
const ANALYTICS_INGEST_PATH = '/.netlify/functions/analytics-ingest';

let analyticsInitialized = false;
let flushTimer = null;
let inFlightFlush = null;
let analyticsIngestSuppressed = false;

function isEnabledFlag(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

export function isAnalyticsConfigured(env = import.meta.env) {
  return Boolean(
    isEnabledFlag(env?.VITE_ANALYTICS_ENABLED) &&
    env?.VITE_SUPABASE_URL &&
    env?.VITE_SUPABASE_ANON_KEY,
  );
}

export function isAnalyticsDebugEnabled(env = import.meta.env, storage = null) {
  if (isEnabledFlag(env?.VITE_ANALYTICS_DEBUG)) return true;
  const targetStorage = storage || (typeof window !== 'undefined' ? window.localStorage : null);

  try {
    return targetStorage?.getItem?.(ANALYTICS_DEBUG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function logAnalyticsDebug(message, detail = {}) {
  if (!isAnalyticsDebugEnabled()) return;
  console.info('[codeherway analytics]', message, detail);
}

function getSafePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  return payload;
}

function normalizeEventName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().slice(0, MAX_EVENT_NAME_CHARS);
}

function loadPersistedQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistQueue(queue) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore localStorage write failures (private mode/quota).
  }
}

function getQueue() {
  if (typeof window === 'undefined') return [];
  if (!Array.isArray(window[ANALYTICS_QUEUE_KEY])) {
    window[ANALYTICS_QUEUE_KEY] = loadPersistedQueue();
  }
  return window[ANALYTICS_QUEUE_KEY];
}

function setQueue(queue) {
  if (typeof window === 'undefined') return;
  window[ANALYTICS_QUEUE_KEY] = queue;
  persistQueue(queue);
}

function enqueue(entry) {
  const queue = getQueue();
  queue.push(entry);
  if (queue.length > MAX_ANALYTICS_QUEUE) {
    queue.splice(0, queue.length - MAX_ANALYTICS_QUEUE);
  }
  setQueue(queue);
  return queue.length;
}

function trimQueue(count) {
  if (count <= 0) return;
  const queue = getQueue();
  if (!queue.length) return;
  queue.splice(0, count);
  setQueue(queue);
}

async function getAccessToken() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || '';
  } catch {
    return '';
  }
}

async function postBatch(events) {
  if (!events.length) return true;
  if (!isAnalyticsConfigured() || analyticsIngestSuppressed) {
    logAnalyticsDebug('ingest-skipped', {
      reason: analyticsIngestSuppressed ? 'suppressed' : 'not_configured',
      count: events.length,
    });
    return false;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    logAnalyticsDebug('ingest-skipped', { reason: 'missing_session', count: events.length });
    return false;
  }

  try {
    const response = await fetch(ANALYTICS_INGEST_PATH, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ events }),
    });

    if (response.status === 401 || response.status === 403) {
      analyticsIngestSuppressed = true;
      logAnalyticsDebug('ingest-suppressed', {
        reason: 'unauthorized',
        status: response.status,
      });
      return false;
    }

    if (!response.ok) {
      logAnalyticsDebug('ingest-failed', { status: response.status });
      return false;
    }

    return true;
  } catch {
    logAnalyticsDebug('ingest-failed', { reason: 'network_error' });
    return false;
  }
}

function scheduleFlushLoop() {
  if (typeof window === 'undefined') return;
  if (flushTimer) {
    window.clearTimeout(flushTimer);
  }
  flushTimer = window.setTimeout(() => {
    void flushAnalyticsQueue();
    scheduleFlushLoop();
  }, FLUSH_INTERVAL_MS);
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    void flushAnalyticsQueue({ force: true });
    return;
  }
  void flushAnalyticsQueue();
  scheduleFlushLoop();
}

export async function flushAnalyticsQueue({ force = false } = {}) {
  if (typeof window === 'undefined') return false;
  if (!isAnalyticsConfigured() || analyticsIngestSuppressed) return false;
  if (inFlightFlush && !force) return inFlightFlush;
  if (!force && document.visibilityState === 'hidden') return false;

  const run = (async () => {
    let sentAny = false;

    while (true) {
      const queue = getQueue();
      if (!queue.length) break;

      const batch = queue.slice(0, FLUSH_BATCH_SIZE);
      const ok = await postBatch(batch);
      if (!ok) break;

      trimQueue(batch.length);
      sentAny = true;

      if (!force) break;
    }

    return sentAny;
  })();

  inFlightFlush = run.finally(() => {
    inFlightFlush = null;
  });

  return inFlightFlush;
}

export function initializeAnalytics() {
  if (typeof window === 'undefined' || analyticsInitialized) return;
  if (!isAnalyticsConfigured() || analyticsIngestSuppressed) {
    logAnalyticsDebug('initialize-skipped', {
      reason: analyticsIngestSuppressed ? 'suppressed' : 'not_configured',
    });
    return;
  }

  analyticsInitialized = true;
  getQueue();

  window.addEventListener('online', () => {
    void flushAnalyticsQueue({ force: true });
  });
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('beforeunload', () => {
    void flushAnalyticsQueue({ force: true });
  });

  scheduleFlushLoop();
  void flushAnalyticsQueue();
}

export function trackEvent(name, payload = {}) {
  if (typeof window === 'undefined') return;

  const eventName = normalizeEventName(name);
  if (!eventName) return;
  if (!isAnalyticsConfigured() || analyticsIngestSuppressed) {
    logAnalyticsDebug('track-skipped', {
      reason: analyticsIngestSuppressed ? 'suppressed' : 'not_configured',
      name: eventName,
    });
    return;
  }

  initializeAnalytics();

  const entry = {
    name: eventName,
    path: window.location.pathname || '/',
    ts: new Date().toISOString(),
    payload: getSafePayload(payload),
  };

  const queueSize = enqueue(entry);
  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: entry }));

  if (queueSize >= FLUSH_TRIGGER_SIZE) {
    void flushAnalyticsQueue();
  }

  if (isAnalyticsDebugEnabled()) {
    console.info('[codeherway analytics]', 'event-queued', entry);
  }
}

