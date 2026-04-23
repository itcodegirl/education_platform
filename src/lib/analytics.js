const ANALYTICS_QUEUE_KEY = '__cinovaAnalyticsQueue';
const ANALYTICS_EVENT_NAME = 'cinova:analytics';
const MAX_ANALYTICS_QUEUE = 200;

function getSafePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return payload;
}

export function trackEvent(name, payload = {}) {
  if (typeof window === 'undefined') return;
  if (!name || typeof name !== 'string') return;

  const entry = {
    name,
    path: window.location.pathname,
    ts: new Date().toISOString(),
    payload: getSafePayload(payload),
  };

  const queue = Array.isArray(window[ANALYTICS_QUEUE_KEY]) ? window[ANALYTICS_QUEUE_KEY] : [];
  queue.push(entry);
  if (queue.length > MAX_ANALYTICS_QUEUE) {
    queue.splice(0, queue.length - MAX_ANALYTICS_QUEUE);
  }
  window[ANALYTICS_QUEUE_KEY] = queue;

  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: entry }));

  if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG === 'true') {
    console.info('[cinova analytics]', entry);
  }
}
