import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const learningExperienceCss = readFileSync(
  path.join(process.cwd(), 'src/styles/learning-experience.css'),
  'utf8',
);

describe('guest preview mobile layout styles', () => {
  it('keeps public preview actions comfortably tappable on small screens', () => {
    expect(learningExperienceCss).toMatch(/@media\s*\(max-width:\s*600px\)/);
    expect(learningExperienceCss).toMatch(/\.gp-back\s*{[^}]*min-height:\s*44px;/s);
    expect(learningExperienceCss).toMatch(/\.gp-cta-btn\s*{[^}]*width:\s*100%;[^}]*min-height:\s*48px;/s);
  });

  it('reduces guest preview spacing for phone viewports', () => {
    expect(learningExperienceCss).toMatch(/\.gp-content\s*{[^}]*padding:[^}]*16px/s);
    expect(learningExperienceCss).toMatch(/\.gp-banner\s*{[^}]*padding:\s*14px;[^}]*margin-bottom:\s*16px;/s);
    expect(learningExperienceCss).toMatch(/\.gp-cta\s*{[^}]*margin-top:\s*28px;[^}]*padding:\s*28px 16px;/s);
  });
});
