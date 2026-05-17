import { describe, expect, it, vi } from 'vitest';
import {
  formatProductionDeployCheck,
  parseProductionDeployArgs,
  runProductionDeployCheck,
} from '../../scripts/check-production-deploy.mjs';

const BASE_URL = 'https://codeherway.test/';
const APP_SHELL = `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/index-abc123.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-def456.js"></script>
  </body>
</html>`;

function makeResponse(body, init = {}) {
  return new Response(body, {
    status: 200,
    headers: { 'cache-control': 'public, max-age=0, must-revalidate', ...init.headers },
    ...init,
  });
}

function createFetchMock(overrides = {}) {
  const responses = new Map([
    ['https://codeherway.test/', makeResponse(APP_SHELL, {
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate',
        'content-type': 'text/html; charset=utf-8',
      },
    })],
    ['https://codeherway.test/index.html', makeResponse(APP_SHELL, {
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate',
        'content-type': 'text/html; charset=utf-8',
      },
    })],
    ['https://codeherway.test/sw.js', makeResponse("const CACHE_VERSION = 'v12';", {
      headers: { 'cache-control': 'public, max-age=0, must-revalidate' },
    })],
    ['https://codeherway.test/manifest.json', makeResponse('{"name":"CodeHerWay"}', {
      headers: { 'cache-control': 'public, max-age=0, must-revalidate' },
    })],
    ['https://codeherway.test/__health', makeResponse(APP_SHELL, {
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate',
        'content-type': 'text/html; charset=utf-8',
      },
    })],
    ['https://codeherway.test/assets/index-abc123.css', makeResponse('body{}', {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    })],
    ...Object.entries(overrides),
  ]);

  return vi.fn(async (url) => {
    const response = responses.get(String(url));
    if (!response) {
      throw new Error(`Unexpected fetch: ${url}`);
    }
    return response.clone();
  });
}

describe('production deploy check', () => {
  it('passes when the live deploy shape is healthy', async () => {
    const result = await runProductionDeployCheck({
      url: BASE_URL,
      spaFallbackPath: '/__health',
      fetchImpl: createFetchMock(),
      localSwSource: "const CACHE_VERSION = 'v12';",
    });

    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.passed)).toBe(true);
    expect(result.checks.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        'homepage responds with HTTP 200',
        '/sw.js uses revalidation cache headers',
        '/sw.js serves v12',
        'SPA fallback route returns app shell HTML',
        'first hashed asset is immutable',
      ]),
    );
  });

  it('fails when the deployed service worker version is stale', async () => {
    const result = await runProductionDeployCheck({
      url: BASE_URL,
      spaFallbackPath: '/__health',
      fetchImpl: createFetchMock({
        'https://codeherway.test/sw.js': makeResponse("const CACHE_VERSION = 'v11';", {
          headers: { 'cache-control': 'public, max-age=0, must-revalidate' },
        }),
      }),
      localSwSource: "const CACHE_VERSION = 'v12';",
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toContainEqual(expect.objectContaining({
      name: '/sw.js serves v12',
      passed: false,
    }));
    expect(formatProductionDeployCheck(result)).toContain('[FAIL] /sw.js serves v12');
  });

  it('parses URL and timeout overrides from CLI args', () => {
    expect(parseProductionDeployArgs([
      '--url',
      'https://example.test/app',
      '--spa-path=/health',
      '--timeout-ms',
      '2500',
    ])).toMatchObject({
      url: 'https://example.test/app/',
      spaFallbackPath: '/health',
      timeoutMs: 2500,
    });
  });
});
