// Service worker for CodeHerWay.
// Keep navigation network-first so deploys pick up the latest HTML shell.

const CACHE_VERSION = 'v10';
const CACHE_PREFIX = 'chw-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const DATA_CACHE = `${CACHE_PREFIX}data-${CACHE_VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}fonts-${CACHE_VERSION}`;
const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CodeHerWay - Offline</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #10111f;
        color: #f7f4ff;
      }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(255, 107, 157, 0.18), transparent 36rem),
          linear-gradient(135deg, #10111f 0%, #15172a 100%);
      }
      main {
        width: min(100%, 520px);
        padding: 28px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        background: rgba(255,255,255,0.06);
        box-shadow: 0 24px 60px rgba(0,0,0,0.28);
      }
      .brand {
        margin: 0 0 14px;
        color: #4ecdc4;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 9vw, 3.2rem);
        line-height: 1;
      }
      p {
        margin: 16px 0 0;
        color: rgba(247,244,255,0.78);
        font-size: 1rem;
        line-height: 1.7;
      }
      button {
        min-height: 44px;
        margin-top: 22px;
        padding: 0 16px;
        border: 0;
        border-radius: 8px;
        background: #ff6b9d;
        color: #fff;
        font: inherit;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="brand">CodeHerWay</p>
      <h1>You're offline</h1>
      <p>Your last loaded lessons are still safe in this browser. Reconnect, then refresh to sync new cloud progress.</p>
      <button type="button" onclick="location.reload()">Try again</button>
    </main>
  </body>
</html>`;

const SHELL_FILES = [
  '/index.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

function isLegacyCache(name) {
  return (
    name.startsWith(CACHE_PREFIX) ||
    name.startsWith('cinova-') ||
    name.startsWith('codeherway-')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([SHELL_CACHE, DATA_CACHE, FONT_CACHE]);

  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => isLegacyCache(name) && !currentCaches.has(name))
        .map((name) => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  // Never proxy Netlify Functions through the SPA cache layer.
  // Let the browser hit the function endpoint directly.
  if (url.pathname.startsWith('/.netlify/functions/')) return;

  // Always fetch latest manifest so install metadata cannot get stuck on stale branding.
  if (url.pathname === '/manifest.json') {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // All Supabase requests bypass the service worker. The Cache API
  // keys responses by request URL, but Supabase REST/RLS responses
  // vary by Authorization header — two learners on the same browser
  // hitting the same RLS-filtered endpoint would otherwise risk
  // serving each other's cached data on a flaky connection. Auth
  // endpoints additionally need fresh refresh-token responses.
  // Offline read-fallback is intentionally given up here; the
  // progress write path already has its own localStorage retry queue.
  if (url.hostname.includes('supabase')) {
    return;
  }

  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(cacheFirst(request, DATA_CACHE));
    return;
  }

  // Vite hashed assets (JS/CSS chunks including course data, quizzes, lessons)
  // These are immutable (hash changes on content change) — safe to cache forever
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      cacheFirst(request, SHELL_CACHE, { cacheableResponse: isCacheableAssetResponse })
    );
    return;
  }

  // Lesson data chunks (course content for offline use)
  if (url.pathname.match(/data-(html|css|js|react|quizzes|challenges|reference)/)) {
    event.respondWith(cacheFirst(request, DATA_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

async function notifyClients(type, payload = {}) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => {
    client.postMessage({
      type,
      payload: {
        cacheVersion: CACHE_VERSION,
        ...payload,
      },
    });
  });
}

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);

  await Promise.all(
    SHELL_FILES.map(async (file) => {
      try {
        const response = await fetch(file, { cache: 'no-store' });
        if (response.ok) {
          await cache.put(file, response);
        }
      } catch {
        // A missing icon should not prevent the worker from installing.
      }
    })
  );
}

function isHtmlResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

function isCacheableAssetResponse(_request, response) {
  return Boolean(response?.ok) && !isHtmlResponse(response);
}

async function cacheFirst(request, cacheName, options = {}) {
  const { cacheableResponse = (_req, response) => Boolean(response?.ok) } = options;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  const response = await fetch(request);
  if (cacheableResponse(request, response)) {
    await cache.put(request, response.clone());
  }

  return response;
}

async function networkFirst(request, cacheName, options = {}) {
  const { cacheableResponse = (_req, response) => Boolean(response?.ok) } = options;
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (cacheableResponse(request, response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName, options = {}) {
  const { cacheableResponse = (_req, response) => Boolean(response?.ok) } = options;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (cacheableResponse(request, response)) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok && isHtmlResponse(response)) {
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    const fallback = await cache.match('/index.html');
    if (fallback) return fallback;

    notifyClients('SW_NAVIGATION_FALLBACK_USED', {
      url: request.url,
      reason: 'network-error-no-shell-cache',
    }).catch(() => {});

    return new Response(OFFLINE_HTML, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}

