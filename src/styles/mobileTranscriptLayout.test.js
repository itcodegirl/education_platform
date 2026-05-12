import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const platformQualityCss = readFileSync(
  path.join(process.cwd(), 'src/styles/platform-quality.css'),
  'utf8',
);

const featureProfileCss = readFileSync(
  path.join(process.cwd(), 'src/styles/feature-profile.css'),
  'utf8',
);

describe('mobile transcript layout styles', () => {
  it('keeps evidence transcript grids readable on narrow screens', () => {
    expect(platformQualityCss).toMatch(
      /@media\s*\(max-width:\s*600px\)[\s\S]*\.ss-transcript-grid\s*{[^}]*grid-template-columns:\s*1fr;/,
    );
    expect(featureProfileCss).toMatch(
      /@media\s*\(max-width:\s*600px\)[\s\S]*\.pp-transcript-grid\s*{[^}]*grid-template-columns:\s*1fr;/,
    );
  });

  it('allows recommended transcript actions to wrap instead of overflow', () => {
    expect(platformQualityCss).toMatch(/\.ss-transcript-action\s*{[^}]*overflow-wrap:\s*anywhere;/s);
    expect(featureProfileCss).toMatch(/\.pp-transcript-action\s*{[^}]*overflow-wrap:\s*anywhere;/s);
  });
});
