import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = process.cwd();

async function createServiceWorkerHarness({
  fetchImpl = vi.fn(async () => new Response('ok')),
  initialCache = new Map(),
} = {}) {
  const source = await readFile(path.join(projectRoot, 'public/sw.js'), 'utf8');
  const listeners = {};
  const postedMessages = [];
  const cacheStore = new Map(initialCache);
  const cache = {
    match: vi.fn(async (request) => cacheStore.get(typeof request === 'string' ? request : request.url)),
    put: vi.fn(async (request, response) => {
      cacheStore.set(typeof request === 'string' ? request : request.url, response.clone());
    }),
  };

  const context = {
    URL,
    Response,
    Set,
    Promise,
    console,
    fetch: fetchImpl,
    caches: {
      keys: vi.fn(async () => []),
      open: vi.fn(async () => cache),
      delete: vi.fn(async () => true),
    },
    self: {
      addEventListener: (type, handler) => {
        listeners[type] = handler;
      },
      skipWaiting: vi.fn(),
      clients: {
        claim: vi.fn(async () => {}),
        matchAll: vi.fn(async () => [
          {
            postMessage: (message) => postedMessages.push(message),
          },
        ]),
      },
    },
  };

  vm.runInNewContext(source, context, { filename: 'public/sw.js' });

  return { listeners, cache, cacheStore, postedMessages, fetchImpl };
}

function dispatchFetch(listeners, request) {
  let responsePromise = null;
  listeners.fetch({
    request,
    respondWith: (promise) => {
      responsePromise = Promise.resolve(promise);
    },
  });
  return responsePromise;
}

function dispatchMessage(listeners, data) {
  let waitPromise = Promise.resolve();
  listeners.message({
    data,
    waitUntil: (promise) => {
      waitPromise = Promise.resolve(promise);
    },
  });
  return waitPromise;
}

describe('service worker navigation fallback', () => {
  it('returns an offline document for uncached HTML requests even when request mode is not navigate', async () => {
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/',
      mode: 'same-origin',
      destination: '',
      cache: 'default',
      headers: new Headers({ accept: 'text/html' }),
    });

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toContain("You're offline");
  });

  it('returns a branded offline document instead of rejecting uncached navigation failures', async () => {
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/learn/html/module/lesson',
      mode: 'navigate',
      destination: 'document',
      cache: 'default',
    });

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toContain('CodeHerWay');
    expect(harness.postedMessages).toContainEqual(expect.objectContaining({
      type: 'SW_NAVIGATION_FALLBACK_USED',
    }));
  });

  it('returns an explicit 504 response for uncached asset failures instead of rejecting fetch events', async () => {
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/assets/missing.js',
      mode: 'same-origin',
      destination: 'script',
      cache: 'default',
      headers: new Headers({ accept: '*/*' }),
    });

    expect(response.status).toBe(504);
    await expect(response.text()).resolves.toBe('');
  });

  it('returns an explicit 504 response for uncached manifest failures instead of rejecting fetch events', async () => {
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/manifest.json',
      mode: 'same-origin',
      destination: 'manifest',
      cache: 'default',
      headers: new Headers({ accept: 'application/manifest+json' }),
    });

    expect(response.status).toBe(504);
  });

  it('serves cached app shell navigation when the network is unavailable', async () => {
    const cachedShell = new Response('<main>Cached shell</main>', {
      headers: { 'Content-Type': 'text/html' },
    });
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
      initialCache: new Map([['/index.html', cachedShell]]),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/',
      mode: 'navigate',
      destination: 'document',
      cache: 'default',
    });

    await expect(response.text()).resolves.toContain('Cached shell');
    expect(response.status).toBe(200);
  });

  it('prefers a cached current lesson route before the generic shell', async () => {
    const cachedLesson = new Response('<main>Cached lesson route</main>', {
      headers: { 'Content-Type': 'text/html' },
    });
    const cachedShell = new Response('<main>Cached shell</main>', {
      headers: { 'Content-Type': 'text/html' },
    });
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
      initialCache: new Map([
        ['/learn/html/101/lesson-01', cachedLesson],
        ['/index.html', cachedShell],
      ]),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/learn/html/101/lesson-01',
      mode: 'navigate',
      destination: 'document',
      cache: 'default',
    });

    await expect(response.text()).resolves.toContain('Cached lesson route');
  });

  it('keeps manifest fetches network-first with cache fallback', async () => {
    const cachedManifest = new Response('{"name":"CodeHerWay"}', {
      headers: { 'Content-Type': 'application/manifest+json' },
    });
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async () => {
        throw new TypeError('network failed');
      }),
      initialCache: new Map([['https://codeherway.test/manifest.json', cachedManifest]]),
    });

    const response = await dispatchFetch(harness.listeners, {
      method: 'GET',
      url: 'https://codeherway.test/manifest.json',
      mode: 'same-origin',
      destination: 'manifest',
      cache: 'default',
    });

    await expect(response.json()).resolves.toEqual({ name: 'CodeHerWay' });
  });

  it('pre-caches the current lesson route when the app reports a safe learn path', async () => {
    const harness = await createServiceWorkerHarness({
      fetchImpl: vi.fn(async (url) => new Response('<main>Lesson shell</main>', {
        headers: { 'Content-Type': 'text/html' },
        status: String(url).startsWith('/learn/') ? 200 : 404,
      })),
    });

    await dispatchMessage(harness.listeners, {
      type: 'CACHE_CURRENT_LESSON',
      payload: {
        path: '/learn/html/101/lesson-01',
        courseId: 'html',
        moduleId: '101',
        lessonId: 'lesson-01',
      },
    });

    expect(harness.cacheStore.has('/learn/html/101/lesson-01')).toBe(true);
    expect(harness.cacheStore.has('/index.html')).toBe(true);
    expect(harness.postedMessages).toContainEqual(expect.objectContaining({
      type: 'SW_CURRENT_LESSON_CACHED',
    }));
  });

  it('ignores unsafe current lesson cache paths', async () => {
    const harness = await createServiceWorkerHarness();

    await dispatchMessage(harness.listeners, {
      type: 'CACHE_CURRENT_LESSON',
      payload: { path: 'https://other.example/learn/html/101/lesson-01' },
    });

    expect(harness.fetchImpl).not.toHaveBeenCalled();
    expect(harness.cache.put).not.toHaveBeenCalled();
  });
});
