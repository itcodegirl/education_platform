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
  </head>
  <body>
    <main>
      <h1>You're offline</h1>
      <p>Reconnect and refresh to keep learning with CodeHerWay.</p>
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

