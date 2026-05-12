import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

async function readProjectFile(filePath) {
  return readFile(path.join(projectRoot, filePath), 'utf8');
}

describe('service worker versioning', () => {
  it('keeps the registered script URL aligned with the cache version', async () => {
    const [serviceWorkerSource, registrationSource] = await Promise.all([
      readProjectFile('public/sw.js'),
      readProjectFile('src/lib/registerSW.js'),
    ]);

    const cacheVersion = serviceWorkerSource.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];
    const registeredVersion = registrationSource.match(/SW_SCRIPT_URL\s*=\s*['"]\/sw\.js\?v=([^'"]+)['"]/)?.[1];
    const normalizedCacheVersion = cacheVersion?.replace(/^v/, '');

    expect(cacheVersion).toBeTruthy();
    expect(registeredVersion).toBe(normalizedCacheVersion);
  });
});
