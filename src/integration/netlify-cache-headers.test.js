import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const netlifyToml = readFileSync(path.join(process.cwd(), 'netlify.toml'), 'utf8')
  .replace(/\r\n/g, '\n');

function getHeaderBlock(target) {
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = netlifyToml.match(
    new RegExp(`\\[\\[headers\\]\\]\\s+for\\s+=\\s+"${escapedTarget}"[\\s\\S]*?(?=\\n\\[\\[headers\\]\\]|$)`),
  );
  return match?.[0] || '';
}

describe('Netlify cache headers', () => {
  it('keeps the SPA shell and service worker revalidated on every deploy', () => {
    ['/', '/index.html', '/*.html', '/sw.js', '/manifest.json'].forEach((target) => {
      expect(getHeaderBlock(target)).toContain(
        'Cache-Control = "public, max-age=0, must-revalidate"',
      );
    });
  });

  it('keeps hashed Vite assets immutable', () => {
    expect(getHeaderBlock('/assets/*')).toContain(
      'Cache-Control = "public, max-age=31536000, immutable"',
    );
  });
});
