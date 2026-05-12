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

  it('keeps mobile panel escape hatches visible and clear of safe-area clipping', () => {
    expect(mobileInteractionsCss).toMatch(/\.panel-overlay\s*{[^}]*align-items:\s*stretch;/s);
    expect(mobileInteractionsCss).toMatch(/\.panel,\s*\.roadmap-panel,\s*\.ss-modal,\s*\.wn-modal\s*{[^}]*max-height:\s*calc\(100dvh/s);
    expect(mobileInteractionsCss).toMatch(/\.search-head,\s*\.cheatsheet-head,\s*\.ss-head,\s*\.panel-head,\s*\.wn-header\s*{[^}]*position:\s*sticky;[^}]*top:\s*0;/s);
    expect(mobileInteractionsCss).toMatch(/\.cheatsheet-body,\s*\.ss-body,\s*\.roadmap-body,\s*\.wn-body,\s*\.panel-body\s*{[^}]*padding-bottom:\s*calc\(24px \+ env\(safe-area-inset-bottom, 0px\)\);/s);
  });
});
