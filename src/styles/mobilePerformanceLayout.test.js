import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mobilePerformanceCss = readFileSync(
  path.join(process.cwd(), 'src/styles/mobile-performance.css'),
  'utf8',
);

describe('mobile performance layout styles', () => {
  it('contains scroll work to the active mobile surface', () => {
    expect(mobilePerformanceCss).toMatch(/\.main-shell\s*{[^}]*touch-action:\s*pan-y;/s);
    expect(mobilePerformanceCss).toMatch(/\.search-results,\s*\.mobile-tools-sheet,\s*\.cheatsheet-body\s*{[^}]*overscroll-behavior-y:\s*contain;/s);
    expect(mobilePerformanceCss).toMatch(/\.code-preview-code,\s*\.qq-code,\s*\.lb-instructions-code\s*{[^}]*overscroll-behavior-inline:\s*contain;/s);
  });

  it('adds mobile-only rendering hints for heavy learning surfaces', () => {
    expect(mobilePerformanceCss).toMatch(/@supports\s*\(content-visibility:\s*auto\)/);
    expect(mobilePerformanceCss).toMatch(/\.lesson-quiz-wrap,[\s\S]*content-visibility:\s*auto;/);
    expect(mobilePerformanceCss).toMatch(/contain-intrinsic-size:\s*auto 360px;/);
  });

  it('removes expensive touch-device effects that do not help gesture use', () => {
    expect(mobilePerformanceCss).toMatch(/@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)/);
    expect(mobilePerformanceCss).toMatch(/\.topbar,[\s\S]*backdrop-filter:\s*none;/);
    expect(mobilePerformanceCss).toMatch(/will-change:\s*auto;/);
    expect(mobilePerformanceCss).toMatch(/\.search-result\.active\s*{[^}]*transform:\s*none;/s);
  });
});
