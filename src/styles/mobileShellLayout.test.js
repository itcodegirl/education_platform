import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileShellCss = readFileSync(
  path.join(process.cwd(), 'src/styles/mobile-shell-hardening.css'),
  'utf8',
);
const appCss = readFileSync(path.join(process.cwd(), 'src/styles/App.css'), 'utf8');

describe('mobile shell layout styles', () => {
  it('loads responsive rules after the mobile nav base styles', () => {
    expect(appCss.indexOf("@import './panels.css';")).toBeGreaterThanOrEqual(0);
    expect(appCss.indexOf("@import './responsive.css';")).toBeGreaterThan(
      appCss.indexOf("@import './panels.css';"),
    );
  });

  it('forces the fixed lesson nav visible inside the protected app cascade', () => {
    expect(mobileShellCss).toMatch(/\.lesson-nav\s*{[^}]*display:\s*flex;/s);
    expect(mobileShellCss).toMatch(/\.lesson-nav-btn\s*{[^}]*min-height:\s*52px;/s);
  });

  it('keeps the mobile drawer wrapper from consuming shell layout width', () => {
    expect(mobileShellCss).toMatch(/\.sidebar-shell\s*{[^}]*display:\s*contents;/s);
  });

  it('hides fixed bottom chrome when the virtual keyboard is open', () => {
    expect(mobileShellCss).toMatch(/\.shell\.keyboard-open\s+\.lesson-nav\s*{[^}]*pointer-events:\s*none;/s);
    expect(mobileShellCss).toMatch(/\.shell\.keyboard-open\s+\.theme-toggle\s*{[^}]*pointer-events:\s*none;/s);
  });
});
