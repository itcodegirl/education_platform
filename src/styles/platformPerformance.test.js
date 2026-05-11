import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const platformQualityCss = readFileSync(
  path.join(process.cwd(), 'src/styles/platform-quality.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

describe('platform performance styles', () => {
  it('avoids permanent will-change promotion for idle interactive surfaces', () => {
    const willChangeRules = [
      ...platformQualityCss.matchAll(/(?<selectors>[^{}]+)\{[^{}]*will-change:\s*transform;[^{}]*\}/g),
    ].map((match) => match.groups.selectors.trim());

    expect(willChangeRules.length).toBeGreaterThan(0);
    expect(willChangeRules.every((selectors) =>
      selectors
        .split(',')
        .every((selector) => /:(hover|focus-visible|focus-within)|\.show\b/.test(selector.trim())),
    )).toBe(true);
  });
});
