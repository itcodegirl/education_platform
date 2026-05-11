import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const authCss = readFileSync(path.join(process.cwd(), 'src/styles/auth.css'), 'utf8');
const landingCss = readFileSync(path.join(process.cwd(), 'src/styles/landing.css'), 'utf8');

describe('mobile auth keyboard layout styles', () => {
  it('keeps auth pages scrollable when phone keyboards shrink the viewport', () => {
    expect(landingCss).toMatch(/@media\s*\(max-width:\s*768px\)/);
    expect(landingCss).toMatch(/\.auth-page\.auth-with-hero\s*{[^}]*overflow-y:\s*auto;/s);
    expect(landingCss).toMatch(/\.auth-top\s*{[^}]*scroll-padding-bottom:\s*calc\(180px \+ env\(safe-area-inset-bottom, 0px\)\);/s);
    expect(landingCss).toMatch(/\.auth-top\s+\.auth-card:focus-within\s*{[^}]*scroll-margin-bottom:\s*calc\(180px \+ env\(safe-area-inset-bottom, 0px\)\);/s);
  });

  it('uses phone-sized touch targets and input text that avoids iOS zoom', () => {
    expect(authCss).toMatch(/@media\s*\(max-width:\s*600px\)/);
    expect(authCss).toMatch(/\.auth-field\s+\.ui-input\s*{[^}]*min-height:\s*48px;[^}]*font-size:\s*16px;/s);
    expect(authCss).toMatch(/\.auth-tab,\s*\.auth-submit,\s*\.auth-social-btn,\s*\.auth-preview-btn\s*{[^}]*min-height:\s*48px;/s);
    expect(authCss).toMatch(/\.auth-reset-link\s*{[^}]*min-height:\s*44px;/s);
  });
});
