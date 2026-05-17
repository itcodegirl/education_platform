/* global console, fetch, process */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import { pathToFileURL, URL } from 'node:url';

export const DEFAULT_PRODUCTION_URL = 'https://codeherway-education-platform.netlify.app/';
export const DEFAULT_SPA_FALLBACK_PATH = '/__codeherway-spa-health-check';
export const REVALIDATED_SHELL_PATHS = Object.freeze([
  '/',
  '/index.html',
  '/sw.js',
  '/manifest.json',
]);

function normalizeBaseUrl(value = DEFAULT_PRODUCTION_URL) {
  const parsed = new URL(value);
  parsed.hash = '';
  parsed.search = '';
  if (!parsed.pathname.endsWith('/')) {
    parsed.pathname = `${parsed.pathname}/`;
  }
  return parsed.href;
}

function toAbsoluteUrl(baseUrl, pathname) {
  return new URL(pathname, baseUrl).href;
}

function normalizeHeader(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, '');
}

function hasRevalidationHeader(value) {
  const normalized = normalizeHeader(value);
  return normalized.includes('max-age=0') && normalized.includes('must-revalidate');
}

function hasImmutableAssetHeader(value) {
  const normalized = normalizeHeader(value);
  return normalized.includes('max-age=31536000') && normalized.includes('immutable');
}

function getHeader(response, headerName) {
  return response?.headers?.get?.(headerName) || '';
}

function getExpectedSwVersion(source = '') {
  return source.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1] || '';
}

function getAssetUrlsFromHtml(html = '') {
  const urls = [];
  const assetPattern = /\b(?:src|href)=["']([^"']*\/assets\/[^"']+\.(?:js|css))["']/g;
  let match = assetPattern.exec(html);

  while (match) {
    urls.push(match[1]);
    match = assetPattern.exec(html);
  }

  return [...new Set(urls)];
}

function hasAppShell(html = '') {
  return /<div\s+id=["']root["']/i.test(html) || /CodeHerWay/i.test(html);
}

function makeCheck(name, passed, detail = '') {
  return {
    name,
    passed: Boolean(passed),
    detail,
  };
}

async function fetchWithTimeout(fetchImpl, url, { timeoutMs = 10000, ...options } = {}) {
  let timeout = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetchImpl(url, {
        redirect: 'follow',
        ...options,
      }),
      timeoutPromise,
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fetchText(fetchImpl, url, options) {
  const response = await fetchWithTimeout(fetchImpl, url, options);
  const text = await response.text();
  return { response, text };
}

export function parseProductionDeployArgs(argv = process.argv.slice(2)) {
  const options = {
    url: process.env.CODEHERWAY_PRODUCTION_URL || DEFAULT_PRODUCTION_URL,
    spaFallbackPath: DEFAULT_SPA_FALLBACK_PATH,
    timeoutMs: 10000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--url' && next) {
      options.url = next;
      index += 1;
    } else if (arg.startsWith('--url=')) {
      options.url = arg.slice('--url='.length);
    } else if (arg === '--spa-path' && next) {
      options.spaFallbackPath = next;
      index += 1;
    } else if (arg.startsWith('--spa-path=')) {
      options.spaFallbackPath = arg.slice('--spa-path='.length);
    } else if (arg === '--timeout-ms' && next) {
      options.timeoutMs = Number(next);
      index += 1;
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number(arg.slice('--timeout-ms='.length));
    }
  }

  return {
    ...options,
    url: normalizeBaseUrl(options.url),
    timeoutMs: Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs
      : 10000,
  };
}

export async function runProductionDeployCheck({
  url = DEFAULT_PRODUCTION_URL,
  spaFallbackPath = DEFAULT_SPA_FALLBACK_PATH,
  timeoutMs = 10000,
  fetchImpl = fetch,
  expectedSwVersion = '',
  localSwSource = '',
} = {}) {
  const baseUrl = normalizeBaseUrl(url);
  const checks = [];
  const fetched = new Map();

  async function fetchPath(pathname) {
    const absoluteUrl = toAbsoluteUrl(baseUrl, pathname);
    if (!fetched.has(pathname)) {
      fetched.set(pathname, fetchText(fetchImpl, absoluteUrl, {
        timeoutMs,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      }));
    }
    return fetched.get(pathname);
  }

  const expectedVersion = expectedSwVersion || getExpectedSwVersion(localSwSource);

  try {
    const home = await fetchPath('/');
    checks.push(makeCheck(
      'homepage responds with HTTP 200',
      home.response.status === 200,
      `${home.response.status} ${home.response.statusText}`,
    ));
    checks.push(makeCheck(
      'homepage contains the app shell',
      hasAppShell(home.text),
      'Expected CodeHerWay app shell markers in / response.',
    ));

    for (const pathname of REVALIDATED_SHELL_PATHS) {
      const { response } = await fetchPath(pathname);
      checks.push(makeCheck(
        `${pathname} uses revalidation cache headers`,
        hasRevalidationHeader(getHeader(response, 'cache-control')),
        `cache-control=${getHeader(response, 'cache-control') || '<missing>'}`,
      ));
    }

    const sw = await fetchPath('/sw.js');
    const liveSwVersion = getExpectedSwVersion(sw.text);
    checks.push(makeCheck(
      '/sw.js responds with HTTP 200',
      sw.response.status === 200,
      `${sw.response.status} ${sw.response.statusText}`,
    ));
    if (expectedVersion) {
      checks.push(makeCheck(
        `/sw.js serves ${expectedVersion}`,
        sw.text.includes(`CACHE_VERSION = '${expectedVersion}'`) ||
          sw.text.includes(`CACHE_VERSION="${expectedVersion}"`) ||
          sw.text.includes(`CACHE_VERSION = "${expectedVersion}"`),
        `Expected CACHE_VERSION ${expectedVersion}; live sw.js has ${liveSwVersion || '<missing>'}.`,
      ));
    }

    const fallback = await fetchPath(spaFallbackPath);
    checks.push(makeCheck(
      'SPA fallback route returns HTTP 200',
      fallback.response.status === 200,
      `${spaFallbackPath} -> ${fallback.response.status} ${fallback.response.statusText}`,
    ));
    checks.push(makeCheck(
      'SPA fallback route returns app shell HTML',
      hasAppShell(fallback.text) &&
        (getHeader(fallback.response, 'content-type').includes('text/html') || /<!doctype html/i.test(fallback.text)),
      `content-type=${getHeader(fallback.response, 'content-type') || '<missing>'}`,
    ));

    const assetUrls = getAssetUrlsFromHtml(home.text);
    checks.push(makeCheck(
      'homepage references hashed Vite assets',
      assetUrls.length > 0,
      assetUrls[0] || 'No /assets/*.js or /assets/*.css reference found.',
    ));

    if (assetUrls.length > 0) {
      const assetUrl = new URL(assetUrls[0], baseUrl).href;
      const asset = await fetchWithTimeout(fetchImpl, assetUrl, { timeoutMs });
      checks.push(makeCheck(
        'first hashed asset responds with HTTP 200',
        asset.status === 200,
        `${asset.status} ${asset.statusText} ${assetUrl}`,
      ));
      checks.push(makeCheck(
        'first hashed asset is immutable',
        hasImmutableAssetHeader(getHeader(asset, 'cache-control')),
        `cache-control=${getHeader(asset, 'cache-control') || '<missing>'}`,
      ));
    }
  } catch (error) {
    checks.push(makeCheck(
      'production deploy check completed',
      false,
      error?.message || String(error),
    ));
  }

  return {
    ok: checks.every((check) => check.passed),
    baseUrl,
    expectedSwVersion: expectedVersion,
    checks,
  };
}

async function loadLocalSwSource(rootDir = process.cwd()) {
  return readFile(path.join(rootDir, 'public', 'sw.js'), 'utf8');
}

export function formatProductionDeployCheck(result) {
  const lines = [
    `Production deploy check: ${result.baseUrl}`,
    result.expectedSwVersion ? `Expected service worker: ${result.expectedSwVersion}` : '',
  ].filter(Boolean);

  result.checks.forEach((check) => {
    lines.push(`[${check.passed ? 'PASS' : 'FAIL'}] ${check.name}`);
    if (check.detail) {
      lines.push(`       ${check.detail}`);
    }
  });

  lines.push(result.ok ? 'Production deploy check passed.' : 'Production deploy check failed.');
  return lines.join('\n');
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const options = parseProductionDeployArgs();
  const result = await runProductionDeployCheck({
    ...options,
    localSwSource: await loadLocalSwSource(),
  });

  console.log(formatProductionDeployCheck(result));
  if (!result.ok) {
    process.exit(1);
  }
}
