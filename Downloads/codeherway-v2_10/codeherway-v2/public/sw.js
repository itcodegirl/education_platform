// ═══════════════════════════════════════════════
// SERVICE WORKER — CodeHerWay PWA
//
// Strategy:
//   App shell (JS/CSS/HTML): Cache-first (fast loads)
//   API calls (Supabase):    Network-first (fresh data)
//   Fonts:                   Cache-first (never change)
//   Course data:             Cache-first after first load
//   Images:                  Cache-first
//
// The service worker caches the app shell on install
// so returning users get instant loads even offline.
// Supabase calls go network-first so progress syncs,
// but fall back to cache if offline.
// ═══════════════════════════════════════════════

const CACHE_NAME = 'chw-v2';
const SHELL_CACHE = 'chw-shell-v2';
const DATA_CACHE = 'chw-data-v2';
const FONT_CACHE = 'chw-fonts-v2';

// App shell — cached on install
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// ─── Install: cache app shell ────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_FILES);
    })
  );
  // Activate immediately (don't wait for old SW to die)
  self.skipWaiting();
});

// ─── Activate: clean old caches ──────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, DATA_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ─── Fetch: smart routing ────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST, PUT, DELETE)
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension, websocket, etc.
  if (!url.protocol.startsWith('http')) return;

  // ── Supabase API calls: network-first ──────
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }

  // ── Anthropic API calls: network-only ──────
  if (url.hostname.includes('anthropic')) {
    return; // Don't cache AI responses
  }

  // ── Google Fonts: cache-first ──────────────
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // ── CDN assets (Monaco, etc): cache-first ──
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(cacheFirst(event.request, DATA_CACHE));
    return;
  }

  // ── Hashed assets (/assets/*): cache-first ─
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // ── Everything else: stale-while-revalidate ─
  event.respondWith(staleWhileRevalidate(event.request, SHELL_CACHE));
});

// ═══════════════════════════════════════════════
// CACHING STRATEGIES
// ═══════════════════════════════════════════════

// Cache-first: check cache, fall back to network
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline fallback for navigation
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw err;
  }
}

// Network-first: try network, fall back to cache
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, response.clone());
        });
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
