// Service worker for Cinova.
// Keep navigation network-first so deploys pick up the latest HTML shell.

const CACHE_VERSION = 'v4';
const CACHE_PREFIX = 'chw-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const DATA_CACHE = `${CACHE_PREFIX}data-${CACHE_VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}fonts-${CACHE_VERSION}`;

const SHELL_FILES = [
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([SHELL_CACHE, DATA_CACHE, FONT_CACHE]);

  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && !currentCaches.has(name))
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

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
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
  // These are immutable (hash changes on content change) â€” safe to cache forever
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
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok && isHtmlResponse(response)) {
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    const fallback = await cache.match('/index.html');
    if (fallback) return fallback;
    throw error;
  }
}

