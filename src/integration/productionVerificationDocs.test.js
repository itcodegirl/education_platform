import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('production verification docs', () => {
  it('documents the live Netlify verification command and evidence record', () => {
    const doc = readRepoFile('docs/netlify-production-verification.md');

    expect(doc).toContain('npm run check:production-deploy -- --url');
    expect(doc).toContain('/sw.js?v=12');
    expect(doc).toContain('Rejected FetchEvent promise observed: yes/no');
    expect(doc).toContain('Cache-Control: public, max-age=31536000, immutable');
  });

  it('exposes the production deploy check as an opt-in package script', () => {
    const packageJson = JSON.parse(readRepoFile('package.json'));

    expect(packageJson.scripts['check:production-deploy'])
      .toBe('node scripts/check-production-deploy.mjs');
  });
});
