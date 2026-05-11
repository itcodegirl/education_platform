import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileShellCss = readFileSync(
  path.join(process.cwd(), 'src/styles/mobile-shell-hardening.css'),
  'utf8',
);

describe('mobile shell layout styles', () => {
  it('keeps the mobile drawer wrapper from consuming shell layout width', () => {
    expect(mobileShellCss).toMatch(/\.sidebar-shell\s*{[^}]*display:\s*contents;/s);
  });

  it('hides fixed bottom chrome when the virtual keyboard is open', () => {
    expect(mobileShellCss).toMatch(/\.shell\.keyboard-open\s+\.lesson-nav\s*{[^}]*pointer-events:\s*none;/s);
    expect(mobileShellCss).toMatch(/\.shell\.keyboard-open\s+\.theme-toggle\s*{[^}]*pointer-events:\s*none;/s);
  });
});
