import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileInteractionsCss = readFileSync(
  path.join(process.cwd(), 'src/styles/mobile-interactions.css'),
  'utf8',
);

describe('mobile interaction layout styles', () => {
  it('keeps critical mobile controls at comfortable touch sizes', () => {
    expect(mobileInteractionsCss).toMatch(/\.mobile-tools-close\s*{[^}]*min-height:\s*44px;/s);
    expect(mobileInteractionsCss).toMatch(/\.sidebar-avatar\s*{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
    expect(mobileInteractionsCss).toMatch(/\.lock-label\s*{[^}]*min-height:\s*44px;/s);
    expect(mobileInteractionsCss).toMatch(/\.search-clear\s*{[^}]*min-height:\s*44px;/s);
  });

  it('turns search into a viewport-aware mobile dialog', () => {
    expect(mobileInteractionsCss).toMatch(/\.search-overlay\s*{[^}]*align-items:\s*stretch;/s);
    expect(mobileInteractionsCss).toMatch(/\.search-modal\s*{[^}]*max-height:\s*calc\(100dvh/s);
    expect(mobileInteractionsCss).toMatch(/\.search-hint\s*{[^}]*clip:\s*rect\(0,\s*0,\s*0,\s*0\);/s);
  });
});
